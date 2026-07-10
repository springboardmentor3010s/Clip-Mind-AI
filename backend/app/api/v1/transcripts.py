"""
Transcript Generation Module endpoints.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.transcript import TranscriptOut, TranscriptUpdate
from app.services.transcript_service import generate_transcript, get_transcript, update_transcript

router = APIRouter(prefix="/videos", tags=["Transcripts"])


@router.post("/{video_id}/transcript", response_model=TranscriptOut)
async def create_transcript(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Run speech-to-text on the video's audio and store the transcript."""
    return await generate_transcript(db, video_id, current_user)


@router.get("/{video_id}/transcript", response_model=TranscriptOut)
async def read_transcript(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch a previously generated transcript."""
    return await get_transcript(db, video_id, current_user)


@router.patch("/{video_id}/transcript", response_model=TranscriptOut)
async def edit_transcript(
    video_id: uuid.UUID,
    payload: TranscriptUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Let the video owner manually correct a generated transcript's text."""
    return await update_transcript(db, video_id, current_user, payload.text)