"""
Bookmark router: endpoints for user video bookmarks (save-for-later).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db

from app.schemas.bookmark import (
    BookmarkCreate,
    BookmarkResponse
)

from app.services.bookmark_service import BookmarkService
from app.services.bookmark_item_service import BookmarkItemService
from app.schemas.bookmark_item import (
    BookmarkItemCreate,
    BookmarkItemDetail,
    BookmarkItemStatus,
)

from app.auth.dependencies import get_current_user


router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)


@router.post("/", response_model=BookmarkResponse)
def add_bookmark(
    bookmark: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Add a bookmark (save) for a video."""
    return BookmarkService.add_bookmark(
        db,
        current_user.id,
        bookmark.video_id
    )


@router.get("/", response_model=list[BookmarkResponse])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all bookmarks for the current user."""
    return BookmarkService.get_bookmarks(
        db,
        current_user.id
    )


@router.delete("/{video_id}")
def remove_bookmark(
    video_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Remove a bookmark (unsave) for a video."""
    BookmarkService.remove_bookmark(
        db,
        current_user.id,
        video_id
    )

    return {
        "message": "Bookmark removed"
    }


@router.get("/check/{video_id}")
def check_bookmark(
    video_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Check whether a video is bookmarked by the current user."""
    return {
        "bookmarked": BookmarkService.is_bookmarked(
            db,
            current_user.id,
            video_id
        )
    }


# ----------------------------------------------------------------
# Content-item bookmarks (summaries & key moments / highlights)
# ----------------------------------------------------------------


@router.post("/items/", response_model=BookmarkItemStatus)
def save_content_item(
    payload: BookmarkItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Save an individual content item (summary or key-moment chapter)."""
    BookmarkItemService.add(
        db,
        current_user.id,
        payload.item_type,
        payload.item_id,
        label=payload.label,
    )
    return {"bookmarked": True}


@router.get("/items/", response_model=List[BookmarkItemDetail])
def list_saved_items(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """List all content items saved by the current user, newest first."""
    return BookmarkItemService.list_items(db, current_user.id)


@router.get("/items/check/{item_type}/{item_id}", response_model=BookmarkItemStatus)
def check_saved_item(
    item_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Check whether a content item is already saved by the current user."""
    return {
        "bookmarked": BookmarkItemService.is_saved(
            db,
            current_user.id,
            item_type,
            item_id,
        )
    }


@router.delete("/items/{item_type}/{item_id}")
def unsave_content_item(
    item_type: str,
    item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Remove a saved content item."""
    BookmarkItemService.remove(
        db,
        current_user.id,
        item_type,
        item_id,
    )
    return {"message": "Saved item removed"}
