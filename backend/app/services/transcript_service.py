"""
Transcript Generation Module: runs Whisper speech-to-text on a video's
extracted audio track and stores the result in MongoDB.
"""
import asyncio
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.mongo import transcripts_collection
from app.models.user import User
from app.models.video import Video, VideoStatus
from app.services.ai_models import get_whisper_model
from app.services.video_service import get_video_or_404


def _run_whisper(audio_path: str) -> dict:
    model = get_whisper_model()
    return model.transcribe(audio_path)


async def generate_transcript(db: Session, video_id, current_user: User) -> dict:
    video: Video = get_video_or_404(db, video_id, current_user)

    if video.status != VideoStatus.READY or not video.audio_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video is still processing or has no extracted audio yet.",
        )

    result = await asyncio.to_thread(_run_whisper, video.audio_path)

    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
        for seg in result.get("segments", [])
    ]

    doc = {
        "video_id": str(video_id),
        "owner_id": str(current_user.id),
        "text": result.get("text", "").strip(),
        "segments": segments,
        "language": result.get("language"),
        "status": "done",
        "created_at": datetime.now(timezone.utc),
    }

    await transcripts_collection.update_one(
        {"video_id": str(video_id)}, {"$set": doc}, upsert=True
    )

    return doc


async def get_transcript(db: Session, video_id, current_user: User) -> dict:
    get_video_or_404(db, video_id, current_user)

    doc = await transcripts_collection.find_one({"video_id": str(video_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found. Generate it first.",
        )
    return doc


async def update_transcript(db: Session, video_id, current_user: User, new_text: str) -> dict:
    """Let the video owner manually correct/edit a generated transcript's text."""
    get_video_or_404(db, video_id, current_user)

    existing = await transcripts_collection.find_one({"video_id": str(video_id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transcript not found. Generate it first.",
        )

    await transcripts_collection.update_one(
        {"video_id": str(video_id)},
        {"$set": {"text": new_text.strip(), "edited": True, "updated_at": datetime.now(timezone.utc)}},
    )

    return await transcripts_collection.find_one({"video_id": str(video_id)})