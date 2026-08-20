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
from app.schemas.video import VideoOut, VideoPublishUpdate, VideoShareCreate, VideoShareOut, VideoShareResult
from app.schemas.video_analytics import VideoAnalytics, ViewPing
from app.services.video_service import (
    delete_video_files_and_row,
    get_video_or_404,
    get_video_shares,
    list_published_videos,
    list_shared_with_me,
    list_user_videos,
    revoke_share,
    save_uploaded_video,
    set_video_published,
    share_video,
)
from app.services.video_analytics_service import get_video_analytics, record_view
from app.services.audit_service import log_action
from app.schemas.video import (
    ClassroomShareCreate,
    ClassroomShareOut,
    VideoOut,
    VideoPublishUpdate,
    VideoShareCreate,
    VideoShareOut,
    VideoShareResult,
)
from app.schemas.video_analytics import VideoAnalytics, ViewPing
from app.services.video_service import (
    delete_video_files_and_row,
    get_video_or_404,
    get_video_shares,
    list_published_videos,
    list_shared_with_me,
    list_user_videos,
    list_video_classroom_shares,
    revoke_classroom_share,
    revoke_share,
    save_uploaded_video,
    set_video_published,
    share_video,
    share_video_with_classroom,
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


@router.get("/library", response_model=list[VideoOut])
def get_content_library(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Content Library: every video any user has published, for Learners (and everyone else) to browse."""
    return list_published_videos(db)


@router.get("/shared-with-me", response_model=list[VideoOut])
def get_shared_with_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Shared with Me: every video explicitly shared with the current user."""
    return list_shared_with_me(db, current_user)


@router.get("/{video_id}", response_model=VideoOut)
def get_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a video: owned by the current user, or published to the content library."""
    return get_video_or_404(db, video_id, current_user, require_owner=False)


@router.patch("/{video_id}/publish", response_model=VideoOut)
def publish_video(
    video_id: uuid.UUID,
    payload: VideoPublishUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: publish/unpublish a video to the shared content library."""
    return set_video_published(db, video_id, current_user, payload.is_published)


@router.post("/{video_id}/share", response_model=VideoShareResult)
def share_video_endpoint(
    video_id: uuid.UUID,
    payload: VideoShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: share a video with specific people by email."""
    return share_video(db, video_id, current_user, payload.emails)


@router.get("/{video_id}/share", response_model=list[VideoShareOut])
def list_video_shares(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: list everyone a video is currently shared with."""
    return get_video_shares(db, video_id, current_user)


@router.delete("/{video_id}/share/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_video_share(
    video_id: uuid.UUID,
    share_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: revoke a previously granted share."""
    revoke_share(db, video_id, current_user, share_id)


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
    video = get_video_or_404(db, video_id, current_user, require_owner=False)
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
    Works for the owner watching their own video, or anyone watching a
    published one — that's exactly the audience data owners want to see.
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
    video_label = video.title or video.filename

    await transcripts_collection.delete_one({"video_id": str(video_id)})
    await summaries_collection.delete_one({"video_id": str(video_id)})
    await key_moments_collection.delete_one({"video_id": str(video_id)})
    await video_views_collection.delete_many({"video_id": str(video_id)})

    delete_video_files_and_row(db, video)
    log_action(db, actor_id=current_user.id, action="video.deleted", target_type="video", target_id=video_id, detail=video_label)


@router.post("/{video_id}/share-classroom", response_model=ClassroomShareOut)
def share_video_with_classroom_endpoint(
    video_id: uuid.UUID,
    payload: ClassroomShareCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: share a video with every student enrolled in one of your classrooms."""
    return share_video_with_classroom(db, video_id, current_user, payload.classroom_id)


@router.get("/{video_id}/share-classroom", response_model=list[ClassroomShareOut])
def list_video_classroom_shares_endpoint(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: list every classroom a video is currently shared with."""
    return list_video_classroom_shares(db, video_id, current_user)


@router.delete("/{video_id}/share-classroom/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_video_classroom_share_endpoint(
    video_id: uuid.UUID,
    share_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Owner-only: revoke a video's share with a classroom."""
    revoke_classroom_share(db, video_id, current_user, share_id)