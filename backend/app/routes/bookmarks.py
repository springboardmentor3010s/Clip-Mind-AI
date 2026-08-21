from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Bookmark, Video, User
from app.schemas import BookmarkCreate, BookmarkResponse
from app.utils.role_guard import require_roles


router = APIRouter(
    prefix="/bookmarks",
    tags=["Bookmarks"]
)


@router.post(
    "",
    response_model=BookmarkResponse
)
def create_bookmark(
    bookmark: BookmarkCreate,
    current_user: User = Depends(
        require_roles("learner", "educator", "creator")
    ),
    db: Session = Depends(get_db),
):

    video = db.query(Video).filter(
        Video.id == bookmark.video_id
    ).first()

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    new_bookmark = Bookmark(
        user_id=current_user.id,
        video_id=bookmark.video_id,
        bookmark_type=bookmark.bookmark_type,
        content=bookmark.content,
        timestamp=bookmark.timestamp,
    )

    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    return new_bookmark


@router.get(
    "",
    response_model=list[BookmarkResponse]
)
def get_my_bookmarks(
    current_user: User = Depends(
        require_roles("learner", "educator", "creator")
    ),
    db: Session = Depends(get_db),
):

    bookmarks = (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == current_user.id
        )
        .order_by(Bookmark.created_at.desc())
        .all()
    )

    return bookmarks


@router.delete("/{bookmark_id}")
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(
        require_roles("learner", "educator", "creator")
    ),
    db: Session = Depends(get_db),
):

    bookmark = (
        db.query(Bookmark)
        .filter(
            Bookmark.id == bookmark_id,
            Bookmark.user_id == current_user.id
        )
        .first()
    )

    if bookmark is None:
        raise HTTPException(
            status_code=404,
            detail="Bookmark not found"
        )

    db.delete(bookmark)
    db.commit()

    return {
        "message": "Bookmark deleted successfully"
    }