"""
Video Upload Module endpoints:
- upload a video
- list current user's uploaded videos (upload history)
- get a single video's details
- delete a video (and its transcript/summary/key-moments records)
"""
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.mongo import key_moments_collection, summaries_collection, transcripts_collection
from app.models.user import User
from app.schemas.video import VideoOut
from app.services.video_service import (
    delete_video_files_and_row,
    get_video_or_404,
    list_user_videos,
    save_uploaded_video,
)

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/upload", response_model=VideoOut, status_code=201)
def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a video file (MP4, MOV, AVI, WebM) with a title and optional description."""
    return save_uploaded_video(db, file, current_user, title, description)


@router.get("", response_model=list[VideoOut])
def get_my_videos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current user's upload history."""
    return list_user_videos(db, current_user)


@router.get("/{video_id}", response_model=VideoOut)
def get_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific video (must be owned by the current user)."""
    return get_video_or_404(db, video_id, current_user)


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a video: removes its uploaded/processed files, its Postgres row,
    and any generated transcript, summary, and key-moments documents.
    """
    video = get_video_or_404(db, video_id, current_user)

    await transcripts_collection.delete_one({"video_id": str(video_id)})
    await summaries_collection.delete_one({"video_id": str(video_id)})
    await key_moments_collection.delete_one({"video_id": str(video_id)})

    delete_video_files_and_row(db, video)