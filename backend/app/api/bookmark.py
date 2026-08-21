from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.bookmark_service import (
    add_bookmark,
    remove_bookmark,
    get_user_bookmarks,
    is_bookmarked
)

router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)


# ==========================================
# Add Bookmark
# ==========================================

@router.post("/{user_id}/{video_id}")
def create_bookmark(
    user_id: int,
    video_id: int,
    db: Session = Depends(get_db)
):

    result = add_bookmark(
        db,
        user_id,
        video_id
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


# ==========================================
# Remove Bookmark
# ==========================================

@router.delete("/{user_id}/{video_id}")
def delete_bookmark(
    user_id: int,
    video_id: int,
    db: Session = Depends(get_db)
):

    result = remove_bookmark(
        db,
        user_id,
        video_id
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result


# ==========================================
# Get User Bookmarks
# ==========================================

@router.get("/{user_id}")
def get_bookmarks(
    user_id: int,
    db: Session = Depends(get_db)
):

    bookmarks = get_user_bookmarks(
        db,
        user_id
    )

    return {
        "success": True,
        "count": len(bookmarks),
        "bookmarks": bookmarks
    }


# ==========================================
# Bookmark Status
# ==========================================

@router.get("/{user_id}/{video_id}/status")
def bookmark_status(
    user_id: int,
    video_id: int,
    db: Session = Depends(get_db)
):

    bookmarked = is_bookmarked(
        db,
        user_id,
        video_id
    )

    return {
        "success": True,
        "bookmarked": bookmarked
    }