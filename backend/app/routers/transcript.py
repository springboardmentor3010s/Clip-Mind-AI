from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import require_roles, get_current_user_claims
from app.models.video import VideoMetadata
from app.services.summarization_service import generate_summaries

router = APIRouter(prefix="/transcript", tags=["Transcripts & Summaries"])

class TranscriptEditPayload(BaseModel):
    video_id: int
    updated_transcript: str

@router.put("/edit")
def edit_transcript(
    payload: TranscriptEditPayload,
    db: Session = Depends(get_db),
    user_claims: dict = Depends(require_roles(["Educator", "Content Creator", "Administrator"]))
):
    """Educator & Creator Feature: Review & Edit generated transcripts and update summaries."""
    video = db.query(VideoMetadata).filter(VideoMetadata.id == payload.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video #{payload.video_id} not found")

    video.transcript = payload.updated_transcript
    
    # Auto-regenerate summary from the refined transcript
    try:
        new_summary = generate_summaries(payload.updated_transcript)
        video.summary = new_summary
    except Exception:
        pass

    db.commit()
    db.refresh(video)

    return {
        "status": "success",
        "video_id": video.id,
        "message": "Transcript refined and summary synchronized successfully.",
        "transcript": video.transcript,
        "summary": video.summary
    }