from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.transcription_service import (
    get_transcript,
    regenerate_transcript
)

router = APIRouter(
    prefix="/transcript",
    tags=["Transcript"]
)


# ==========================================
# Get Transcript
# ==========================================

@router.get("/{video_id}")
def fetch_transcript(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Get transcript of a video.
    """

    result = get_transcript(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Transcript fetched successfully.",
        "video_id": result["video_id"],
        "title": result["title"],
        "transcript": result["transcript"],
        "status": result["status"]
    }


# ==========================================
# Regenerate Transcript
# ==========================================

@router.post("/{video_id}")
def generate_transcript(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Regenerate transcript using Whisper.
    """

    result = regenerate_transcript(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Transcript generated successfully.",
        "video_id": result["video_id"],
        "transcript": result["transcript"]
    }


# ==========================================
# Update / Regenerate Transcript
# ==========================================

@router.put("/{video_id}")
def update_transcript(
    video_id: int,
    db: Session = Depends(get_db)
):
    """
    Regenerate and update transcript.
    """

    result = regenerate_transcript(db, video_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return {
        "message": "Transcript updated successfully.",
        "video_id": result["video_id"],
        "transcript": result["transcript"]
    }