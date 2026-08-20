"""
WatchHistory router: endpoints for per-user learning / watch history.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.schemas.watch_history import (
    WatchHistoryCreate,
    WatchHistoryRead,
    CreatorHistoryRead,
)
from app.services.watch_history_service import WatchHistoryService


router = APIRouter(
    prefix="/api/watch-history",
    tags=["Watch History"],
)


@router.put("/videos/{video_id}", response_model=WatchHistoryRead)
def record_watch_history(
    video_id: int,
    payload: WatchHistoryCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record or update a watch-history entry for a video.

    Upserts on (user_id, video_id) — keeps the greatest watch duration
    and completion seen so far, and refreshes last_watched_at.
    """
    entry = WatchHistoryService.record(
        db,
        user_id=current_user.id,
        video_id=video_id,
        watch_duration=payload.watch_duration,
        completion_rate=payload.completion_rate,
    )
    return entry


@router.get("/", response_model=List[WatchHistoryRead])
def get_watch_history(
    limit: int = 100,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's watch history (most recently watched first).
    """
    return WatchHistoryService.get_history(db, current_user.id, limit=limit)


@router.delete("/videos/{video_id}")
def remove_watch_history(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a single entry from the user's watch history."""
    WatchHistoryService.remove(db, current_user.id, video_id)
    return {"message": "History entry removed"}


@router.delete("/")
def clear_watch_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear the current user's entire watch history."""
    removed = WatchHistoryService.clear(db, current_user.id)
    return {"message": "Watch history cleared", "removed": removed}

@router.get("/creator/", response_model=List[CreatorHistoryRead])
def get_creator_history(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the content creator's watch-history showing viewer engagement
    on their uploaded videos.

    Returns per-viewer entries: which viewer watched which video,
    how long they watched, and their completion rate.

    Requires Content Creator role.
    """
    if current_user.role != "Content Creator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Content Creator access required",
        )
    return WatchHistoryService.get_creator_history(db, current_user.id)