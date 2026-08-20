from sqlalchemy.orm import Session

from app.models.bookmark import Bookmark


def get_existing_bookmark(
    db: Session,
    user_id: int,
    content_type: str,
    content_id: int
):
    return (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == user_id,
            Bookmark.content_type == content_type,
            Bookmark.content_id == content_id
        )
        .first()
    )


def create_bookmark(
    db: Session,
    user_id: int,
    content_type: str,
    content_id: int
):
    bookmark = Bookmark(
        user_id=user_id,
        content_type=content_type,
        content_id=content_id
    )

    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)

    return bookmark


def get_bookmarks_by_user(
    db: Session,
    user_id: int
):
    return (
        db.query(Bookmark)
        .filter(
            Bookmark.user_id == user_id
        )
        .order_by(
            Bookmark.created_at.desc()
        )
        .all()
    )


def get_bookmark_by_id(
    db: Session,
    bookmark_id: int,
    user_id: int
):
    return (
        db.query(Bookmark)
        .filter(
            Bookmark.id == bookmark_id,
            Bookmark.user_id == user_id
        )
        .first()
    )


def delete_bookmark(
    db: Session,
    bookmark: Bookmark
):
    db.delete(bookmark)
    db.commit()