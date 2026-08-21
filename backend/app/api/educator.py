from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.transcription_service import (
    get_transcript,
    update_transcript
)

from app.services.summary_service import (
    generate_short_summary,
    generate_detailed_summary
)

router = APIRouter(
    prefix="/educator",
    tags=["Educator"]
)


# ==========================================
# Get Transcript
# ==========================================

@router.get("/transcript/{video_id}")
def transcript(
    video_id: int,
    db: Session = Depends(get_db)
):
    return get_transcript(db, video_id)


# ==========================================
# Edit Transcript
# ==========================================

@router.put("/transcript/{video_id}")
def edit_transcript(
    video_id: int,
    transcript: str,
    db: Session = Depends(get_db)
):

    updated = update_transcript(
        db,
        video_id,
        transcript
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    return {
        "success": True,
        "message": "Transcript updated successfully"
    }


# ==========================================
# Short Summary
# ==========================================

@router.post("/summary/{video_id}/short")
def short_summary(
    video_id: int,
    db: Session = Depends(get_db)
):

    summary = generate_short_summary(
        db,
        video_id
    )

    return {
        "success": True,
        "summary": summary
    }


# ==========================================
# Detailed Summary
# ==========================================

@router.post("/summary/{video_id}/detailed")
def detailed_summary(
    video_id: int,
    db: Session = Depends(get_db)
):

    summary = generate_detailed_summary(
        db,
        video_id
    )

    return {
        "success": True,
        "summary": summary
    }