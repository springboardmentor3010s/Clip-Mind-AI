from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_user
from app.models.bookmark import Bookmark
from app.models.video import Video
from app.models.user import User
from app.schemas.bookmark import BookmarkCreate, BookmarkResponse

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


def _to_response(b: Bookmark) -> dict:
    return {
        "id": b.id,
        "video_id": b.video_id,
        "video_title": b.video.title if b.video else None,
        "target_type": b.target_type,
        "target_id": b.target_id,
        "note": b.note,
        "created_at": b.created_at,
    }


@router.post("", response_model=BookmarkResponse)
def create_bookmark(
    req: BookmarkCreate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    bookmark = Bookmark(
        user_id=current_user.id,
        video_id=req.video_id,
        target_type=req.target_type,
        target_id=req.target_id,
        note=req.note,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return _to_response(bookmark)


@router.get("", response_model=List[BookmarkResponse])
def list_my_bookmarks(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return [_to_response(b) for b in bookmarks]


@router.delete("/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    bookmark = (
        db.query(Bookmark)
        .filter(Bookmark.id == bookmark_id, Bookmark.user_id == current_user.id)
        .first()
    )
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed."}
