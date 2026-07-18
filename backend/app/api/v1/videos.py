"""
Video Upload Module endpoints:
- upload a video
- list current user's uploaded videos (upload history)
- get a single video's details
- stream a video's file for in-app playback
- delete a video (and its transcript/summary/key-moments records)
"""
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.mongo import key_moments_collection, summaries_collection, transcripts_collection, video_views_collection
from app.models.user import User
from app.schemas.video import VideoOut
from app.schemas.video_analytics import VideoAnalytics, ViewPing
from app.services.video_service import (
    delete_video_files_and_row,
    get_video_or_404,
    list_user_videos,
    save_uploaded_video,
)
from app.services.video_analytics_service import get_video_analytics, record_view

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


@router.get("/{video_id}/stream")
def stream_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Serve the video file's bytes for in-app playback. Prefers the
    standardized H.264/AAC MP4 produced by the Video Processing Module
    (browsers play it reliably); falls back to the original upload if
    that step hasn't completed yet.

    Requires the same Bearer auth as every other endpoint here — the
    frontend fetches this via axios (blob) rather than pointing a
    <video> tag straight at the URL, since a plain <video src="..."> tag
    can't attach an Authorization header.
    """
    video = get_video_or_404(db, video_id, current_user)
    path = video.processed_path or video.file_path
    if not path or not Path(path).exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not found on disk.")

    media_type = "video/mp4" if video.processed_path else video.content_type
    return FileResponse(path, media_type=media_type, filename=video.filename)


@router.post("/{video_id}/views", status_code=status.HTTP_204_NO_CONTENT)
async def ping_view(
    video_id: uuid.UUID,
    payload: ViewPing,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record watch progress for the Analytics Dashboard Module. The player
    calls this on playback start (session_start=True) and periodically
    while playing, reporting the furthest position reached so far.
    """
    await record_view(db, video_id, current_user, payload)


@router.get("/{video_id}/analytics", response_model=VideoAnalytics)
async def read_video_analytics(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Views, watch time, completion rate, retention, and audience for one video."""
    return await get_video_analytics(db, video_id, current_user)


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
    await video_views_collection.delete_many({"video_id": str(video_id)})

    delete_video_files_and_row(db, video)