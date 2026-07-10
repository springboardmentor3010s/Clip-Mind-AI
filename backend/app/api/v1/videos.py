"""
Video Upload Module endpoints:
- upload a video
- list current user's uploaded videos (upload history)
- get a single video's details
"""
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.video import VideoOut
from app.services.video_service import save_uploaded_video, list_user_videos, get_video_or_404

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