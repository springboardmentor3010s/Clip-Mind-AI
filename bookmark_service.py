"""
Bookmark service: manages user bookmarks on videos.
"""
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.bookmark import Bookmark
from app.models.video import Video


class BookmarkService:
    """Service for bookmark management."""

    @staticmethod
    def add_bookmark(
        db: Session,
        user_id: int,
        video_id: int
    ) -> Bookmark:
        """Add a bookmark for a video by the current user.

        Validates that the video exists before creating the bookmark.
        If the bookmark already exists, returns the existing one
        (idempotent operation).
        """
        # Validate video exists
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found"
            )

        existing = db.query(Bookmark).filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        ).first()

        if existing:
            return existing

        bookmark = Bookmark(
            user_id=user_id,
            video_id=video_id
        )

        db.add(bookmark)
        db.commit()
        db.refresh(bookmark)

        return bookmark

    @staticmethod
    def remove_bookmark(
        db: Session,
        user_id: int,
        video_id: int
    ) -> bool:
        """Remove a bookmark for a video by the current user."""
        bookmark = db.query(Bookmark).filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        ).first()

        if not bookmark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bookmark not found"
            )

        db.delete(bookmark)
        db.commit()

        return True

    @staticmethod
    def get_bookmarks(
        db: Session,
        user_id: int
    ) -> List[Bookmark]:
        """Get all bookmarks for a user across all videos."""
        return db.query(Bookmark)\
            .options(joinedload(Bookmark.video))\
            .filter(
                Bookmark.user_id == user_id
            ).all()

    @staticmethod
    def is_bookmarked(
        db: Session,
        user_id: int,
        video_id: int
    ) -> bool:
        """Check whether a video is bookmarked by the current user."""
        bookmark = db.query(Bookmark).filter(
            Bookmark.user_id == user_id,
            Bookmark.video_id == video_id
        ).first()

        return bookmark is not None