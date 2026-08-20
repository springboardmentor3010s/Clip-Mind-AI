"""
Video router: video upload, listing, and management endpoints.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.video import VideoRead, VideoUploadResponse, VideoUpdate
from app.services.video_service import VideoService
from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/api/videos",
    tags=["Videos"],
)


@router.post("/upload", response_model=VideoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a video file.

    - **title**: Video title
    - **description**: Video description (optional)
    - **file**: Video file (MP4, MOV, AVI, MKV, etc.)

    Requires authentication.
    """
    try:
        result = VideoService.upload_video(
            db=db,
            user=current_user,
            file=file,
            title=title,
            description=description,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    video = result["video"]
    processing = result["processing"]

    return VideoUploadResponse(
        id=video.id,
        title=video.title,
        filename=video.filename,
        file_size=video.file_size,
        status=video.status,
        message="Video uploaded and processed successfully",
    )


@router.get("/", response_model=List[VideoRead])
def list_videos(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all videos for the current user.

    Requires authentication.
    """
    videos = VideoService.get_videos_by_user(db, current_user.id, skip=skip, limit=limit)
    return videos


@router.get("/browse", response_model=List[VideoRead])
def browse_videos(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Browse the shared library: all published videos uploaded by any user.

    Requires authentication.
    """
    videos = VideoService.get_published_videos(db, skip=skip, limit=limit)
    return videos


@router.get("/dashboard/stats")
def get_dashboard_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get dashboard stat counters (total / recent / processing / completed)
    for the current user using aggregate queries.

    Requires authentication.
    """
    return VideoService.get_dashboard_stats(db, current_user.id)


@router.get("/{video_id}", response_model=VideoRead)
def get_video(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific video by ID.

    Accessible to authenticated users when the video is published
    (shared library) or when the user owns the video.

    Requires authentication.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )
    return video


@router.put("/{video_id}", response_model=VideoRead)
def update_video(
    video_id: int,
    payload: VideoUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a video's metadata.

    Requires authentication.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this video",
        )
    updated_video = VideoService.update_video(db, video, payload)
    return updated_video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a video.

    Requires authentication.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this video",
        )
    VideoService.delete_video(db, video)
    return None
