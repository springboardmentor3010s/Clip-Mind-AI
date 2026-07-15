"""
Bookmarks Module endpoints.
"""
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.bookmark import BookmarkCreate, BookmarkOut
from app.services.bookmark_service import create_bookmark, delete_bookmark, list_bookmarks

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


@router.post("", response_model=BookmarkOut, status_code=status.HTTP_201_CREATED)
async def add_bookmark(
    payload: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bookmark a video, one of its summary variants, or a specific highlight."""
    return await create_bookmark(db, payload, current_user)


@router.get("", response_model=list[BookmarkOut])
async def get_bookmarks(
    video_id: uuid.UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
):
    """List the current user's bookmarks, optionally filtered to one video."""
    return await list_bookmarks(current_user, video_id)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bookmark(
    bookmark_id: str,
    current_user: User = Depends(get_current_user),
):
    """Remove a bookmark."""
    await delete_bookmark(bookmark_id, current_user)