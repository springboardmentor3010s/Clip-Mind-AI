"""
Transcript router: endpoints for video transcript management.

Two patterns:
  1. /api/videos/{video_id}/transcript/*  — database-backed (existing flow)
  2. /transcripts/generate                — simple file-to-transcript (new flow)
"""
import os
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.core.config import settings
from app.database.database import get_db
from app.schemas.transcript import TranscriptRead, TranscriptUpdate
from app.schemas.transcript_validation import TranscriptValidationResponse
from app.models.video import Video
from app.services.video_service import VideoService
from app.services.transcript_service import TranscriptService
from app.services.transcript_validation_service import TranscriptValidationService
from app.services.processing_job_service import (
    JOB_TYPE_TRANSCRIPT,
    complete_job,
    fail_job,
    start_job,
)
from app.auth.dependencies import get_current_user

# ----------------------------------------------------------------
# Router 1 — existing database-backed transcript endpoints
# ----------------------------------------------------------------


router = APIRouter(
    prefix="/api/videos/{video_id}/transcript",
    tags=["Transcripts"],
)

# Shared service instance — Whisper model is loaded once at startup
_transcript_service = TranscriptService()


def _get_video_for_read(db: Session, video_id: int, current_user) -> Video:
    """Look up a video and verify read access (published OR owned by the user)."""
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )
    return video


def _get_video_or_404(db: Session, video_id: int, current_user) -> Video:
    """Look up a video and verify ownership. Raises HTTPException if not found/forbidden."""
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )
    return video


@router.get("/", response_model=TranscriptRead)
def get_transcript(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the transcript for a video (published or owned by the user)."""
    video = _get_video_for_read(db, video_id, current_user)

    if video.transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found. Video may still be processing.",
        )

    return video.transcript


@router.get("/validate", response_model=TranscriptValidationResponse)
def validate_transcript(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate the transcript accuracy & quality for a video.

    Computes a quantitative quality report (confidence, speaking speed,
    duration coverage, filler / empty segment heuristics) with a 0-100
    quality score and rating so educators can quickly review Whisper output.

    Accessible whenever the video is readable (published OR owned by the user).
    """
    video = _get_video_for_read(db, video_id, current_user)

    if video.transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found. Generate a transcript first.",
        )

    report = TranscriptValidationService.validate(
        video.transcript,
        video_duration=video.duration,
    )
    return report


@router.post("/generate", response_model=TranscriptRead)
def generate_transcript(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate transcript for a video using Whisper (database-backed)."""
    video = _get_video_or_404(db, video_id, current_user)

    # Track the AI processing activity on the Admin Dashboard.
    job = start_job(db, video.id, JOB_TYPE_TRANSCRIPT, progress=10)

    try:
        transcript = _transcript_service.generate_and_save(db, video)
        complete_job(db, job.id, result=transcript.transcript)
        return transcript

    except ValueError as e:
        fail_job(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        fail_job(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        fail_job(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to generate transcript for video {video_id}: {e}", exc_info=True)
        fail_job(db, job.id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate transcript: {str(e)}",
        )


@router.put("/", response_model=TranscriptRead)
def update_transcript(
    video_id: int,
    payload: TranscriptUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a video transcript."""
    video = _get_video_or_404(db, video_id, current_user)

    if video.transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found",
        )

    try:
        service = TranscriptService()
        transcript = service.update_transcript(
            db,
            video,
            transcript_text=payload.transcript,
            language=payload.language,
            confidence=payload.confidence,
        )
        return transcript

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Failed to update transcript for video {video_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update transcript: {str(e)}",
        )


# ----------------------------------------------------------------
# Router 2 — simple file-upload → transcript (no database)
# ----------------------------------------------------------------

simple_router = APIRouter(
    prefix="/transcripts",
    tags=["Transcripts - Simple"],
)

VIDEO_UPLOAD_DIR = os.path.join(settings.UPLOAD_DIR, "videos")
os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)

_simple_service = TranscriptService()


@simple_router.post("/generate")
async def generate_transcript_simple(file: UploadFile = File(...)):
    """
    Upload a video file and receive its transcript directly.

    This endpoint does NOT persist to the database — it returns the
    transcript as a JSON response for quick testing / external use.

    Sample response:
    ```json
    {
      "message": "Transcript generated successfully",
      "data": {
        "video_path": "app/uploads/videos/sample.mp4",
        "audio_path": "app/uploads/audio/sample.wav",
        "language": "en",
        "transcript": "Welcome to ClipMind AI...",
        "segments": [...]
      }
    }
    ```
    """
    # Validate file extension
    allowed_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".wav", ".mp3"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}",
        )

    # Save uploaded file
    video_path = os.path.join(VIDEO_UPLOAD_DIR, file.filename)
    try:
        content = await file.read()
        with open(video_path, "wb") as buffer:
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}",
        )

    # Generate transcript
    try:
        transcript = _simple_service.generate_transcript(video_path)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Transcript generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcript generation failed: {str(e)}",
        )

    return {
        "message": "Transcript generated successfully",
        "data": transcript,
    }

