"""
Key Moment Router

Endpoints for CRUD operations and YouTube-style chapter detection.
Uses ChapterGenerationService for topic-change detection and BART summarization.
"""

import json
import logging
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.key_moment import KeyMoment
from app.schemas.key_moment import (
    KeyMomentCreate,
    KeyMomentRead,
    KeyMomentUpdate,
)
from app.schemas.key_moment_response import DetectKeyMomentResponse
from app.services.chapter_service import ChapterGenerationService
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/videos/{video_id}/key-moments",
    tags=["Key Moments"],
)

# Lazy initialization: ChapterGenerationService loads heavy ML models (sentence-transformers + BART),
# so we defer instantiation until it's actually needed to avoid crashing the router at import time.
_chapter_service_instance = None


def get_chapter_service() -> ChapterGenerationService:
    """Get or create the ChapterGenerationService singleton (lazy initialization)."""
    global _chapter_service_instance
    if _chapter_service_instance is None:
        logger.info("Initializing ChapterGenerationService (lazy load)...")
        _chapter_service_instance = ChapterGenerationService()
        logger.info("ChapterGenerationService initialized successfully")
    return _chapter_service_instance


def _detect_key_moments_background(
    video_id: int,
    db: Session,
):
    """Background task to detect YouTube-style chapters without blocking the response."""
    from app.database.database import SessionLocal

    # Create a new database session for the background task
    db = SessionLocal()
    try:
        from app.models.video import Video
        from app.models.key_moment import KeyMoment

        # Fetch video
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video or video.transcript is None:
            logger.error(f"Video {video_id} not found or has no transcript")
            return

        transcript_text = video.transcript.transcript
        if not transcript_text.strip():
            logger.error(f"Transcript is empty for video {video_id}")
            return

        # Get Whisper segments
        segments = get_segments_from_transcript(video)

        if not segments:
            logger.warning(f"No segments found for video {video_id}")
            return

        logger.info(
            f"Background: Generating YouTube-style chapters for video {video_id} "
            f"({len(segments)} segments)"
        )

        # Get or create service (lazy load to avoid ML model loading at import time)
        service = get_chapter_service()

        # Generate chapters using topic-change detection
        result = service.generate_chapters(
            transcript=transcript_text,
            segments=segments,
        )

        chapters = result.get("chapters", [])
        logger.info(f"Background: Generated {len(chapters)} chapters")

        # Remove previous AI-generated key moments before inserting new ones
        db.query(KeyMoment).filter(KeyMoment.video_id == video_id).delete()
        db.commit()

        # Save new chapters
        for ch in chapters:
            # === Title validation guard ===
            title = _sanitize_chapter_title(ch.get("title", ""))
            description = ch.get("description", "") or ""

            moment = KeyMoment(
                video_id=video_id,
                start_time=ch["start_time"],
                end_time=ch["end_time"],
                title=title,
                description=description,
                importance=ch.get("importance", "Medium"),
                confidence=ch.get("score", 0.5),
            )
            db.add(moment)

        # Update video status
        video.status = "processed"
        db.add(video)

        db.commit()

        logger.info(
            f"Background: Chapter detection completed for video {video_id} "
            f"({len(chapters)} chapters saved)"
        )

    except Exception as e:
        db.rollback()
        logger.exception(
            f"Background: Chapter detection failed for video {video_id}: {e}"
        )
    finally:
        db.close()


def _sanitize_chapter_title(title: str) -> str:
    """
    Ensure the title is never empty and fits DB constraints.
    Used as a safety net before saving to DB.
    """
    title = title.strip()
    if not title:
        title = "Key Discussion"
    if len(title) > 255:
        title = title[:255]
    return title


def get_video_for_read(
    db: Session,
    video_id: int,
    current_user,
):
    """
    Validate video existence and read access (published or owned).
    """

    video = VideoService.get_video_by_id(
        db=db,
        video_id=video_id,
    )

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return video


def get_video_or_404(
    db: Session,
    video_id: int,
    current_user,
):
    """
    Validate video existence and ownership.
    """

    video = VideoService.get_video_by_id(
        db=db,
        video_id=video_id,
    )

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    return video


def get_segments_from_transcript(video) -> list:
    """
    Extract Whisper segments from the transcript's stored JSON.

    Returns a list of dicts with: id, start, end, text.
    Falls back to a single segment with the full transcript if no segments stored.
    """
    transcript = video.transcript
    if transcript is None:
        return []

    # Try to get segments from the new JSON column
    segments_data = getattr(transcript, "segments", None)
    if segments_data:
        if isinstance(segments_data, str):
            try:
                return json.loads(segments_data)
            except json.JSONDecodeError:
                pass
        elif isinstance(segments_data, list):
            return segments_data

    # Fallback: create a single segment from full transcript
    return [
        {
            "id": 0,
            "start": 0.0,
            "end": getattr(video, "duration", 0.0) or 0.0,
            "text": transcript.transcript,
        }
    ]


@router.get(
    "/",
    response_model=List[KeyMomentRead],
)
def get_key_moments(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    video = get_video_for_read(
        db,
        video_id,
        current_user,
    )

    return (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video.id)
        .all()
    )


@router.post(
    "/",
    response_model=KeyMomentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_key_moment(
    video_id: int,
    payload: KeyMomentCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    get_video_or_404(
        db,
        video_id,
        current_user,
    )

    moment = KeyMoment(
        video_id=video_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        title=payload.title,
        description=payload.description,
        importance=payload.importance or "Medium",
        confidence=payload.confidence,
    )

    db.add(moment)
    db.commit()
    db.refresh(moment)

    return moment


@router.put(
    "/{moment_id}",
    response_model=KeyMomentRead,
)
def update_key_moment(
    video_id: int,
    moment_id: int,
    payload: KeyMomentUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing key moment.
    """

    get_video_or_404(
        db,
        video_id,
        current_user,
    )

    moment = (
        db.query(KeyMoment)
        .filter(
            KeyMoment.id == moment_id,
            KeyMoment.video_id == video_id,
        )
        .first()
    )

    if moment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key moment not found",
        )

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(moment, field, value)

    db.commit()
    db.refresh(moment)

    return moment


@router.delete(
    "/{moment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_key_moment(
    video_id: int,
    moment_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a key moment.
    """

    get_video_or_404(
        db,
        video_id,
        current_user,
    )

    moment = (
        db.query(KeyMoment)
        .filter(
            KeyMoment.id == moment_id,
            KeyMoment.video_id == video_id,
        )
        .first()
    )

    if moment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Key moment not found",
        )

    db.delete(moment)
    db.commit()

    return None


@router.post(
    "/detect",
    response_model=DetectKeyMomentResponse,
)
def detect_key_moments(
    video_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Detect YouTube-style chapters using topic-change detection.

    Pipeline:
      1. Pull Whisper segments from transcript (stored with real timestamps)
      2. Compute embeddings for each segment
      3. Detect topic shifts based on cosine similarity
      4. Group segments into chapters
      5. Generate chapter title + description via BART
      6. Compute importance score
      7. Save to database
    """

    video = get_video_or_404(
        db,
        video_id,
        current_user,
    )

    if video.transcript is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found. Generate a transcript first.",
        )

    # Prevent duplicate detection
    existing = (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video_id)
        .count()
    )

    if existing > 0:
        logger.info(
            "Key moments already exist for video %s (%s detected)",
            video_id,
            existing,
        )
        return {
            "message": "Key moments already exist.",
            "keywords": [],
            "total_detected": existing,
            "key_moments": [],
        }

    # Set status to processing
    video.status = "processing_key_moments"
    db.add(video)
    db.commit()

    # Add chapter detection to background tasks
    background_tasks.add_task(_detect_key_moments_background, video_id, db)

    # Return 202 Accepted with info
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "message": "Chapter detection started. This may take a few minutes. Please check back in a moment.",
            "keywords": [],
            "total_detected": 0,
            "key_moments": [],
        },
    )
