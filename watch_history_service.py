"""
WatchHistory service: manages per-user learning / watch history.
"""
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models.video import Video
from app.models.watch_history import WatchHistory
from app.schemas.watch_history import ViewerMini, CreatorHistoryRead


class WatchHistoryService:
    """Service for watching-history management."""

    @staticmethod
    def record(
        db: Session,
        user_id: int,
        video_id: int,
        watch_duration: float = 0.0,
        completion_rate: float = 0.0,
    ) -> WatchHistory:
        """Insert or update (upsert) a history entry for a video.

        Validates that the video exists and is accessible (published or
        owned by the user) before recording.
        """
        video = db.query(Video).filter(Video.id == video_id).first()
        if video is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Video not found",
            )
        if not video.is_published and video.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this video",
            )

        entry = (
            db.query(WatchHistory)
            .filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == video_id,
            )
            .first()
        )

        # Only keep the longest-known watch duration / max progress.
        if entry:
            entry.watch_duration = max(entry.watch_duration, watch_duration)
            entry.completion_rate = max(entry.completion_rate, completion_rate)
            # Refresh the "last watched" timestamp with the DB clock.
            # (Assigning None would mark the column dirty and render NULL in the
            #  UPDATE, which the NOT NULL constraint rejects.)
            entry.last_watched_at = func.now()
            db.add(entry)
            db.commit()
            db.refresh(entry)
            return entry

        entry = WatchHistory(
            user_id=user_id,
            video_id=video_id,
            watch_duration=watch_duration,
            completion_rate=completion_rate,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def get_history(
        db: Session,
        user_id: int,
        limit: int = 100,
    ) -> List[WatchHistory]:
        """Get a user's watch history, most recently watched first."""
        return (
            db.query(WatchHistory)
            .options(joinedload(WatchHistory.video))
            .filter(WatchHistory.user_id == user_id)
            .order_by(WatchHistory.last_watched_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_creator_history(
        db: Session,
        creator_id: int,
        limit: int = 100,
    ) -> List[CreatorHistoryRead]:
        """Get watch history for all videos owned by a creator.

        Returns per-viewer engagement entries (who watched which of the
        creator's videos, how long they watched, and how far they got).
        Results are ordered by most recently watched first.
        """
        watch_histories = (
            db.query(WatchHistory)
            .options(joinedload(WatchHistory.video))
            .options(joinedload(WatchHistory.user))
            .join(WatchHistory.video)
            .filter(Video.user_id == creator_id)
            .order_by(WatchHistory.last_watched_at.desc())
            .limit(limit)
            .all()
        )

        # Transform to CreatorHistoryRead schema
        results = []
        for wh in watch_histories:
            viewer = wh.user
            viewer_mini = ViewerMini(
                id=viewer.id,
                username=viewer.username,
                full_name=viewer.full_name,
                avatar_url=viewer.avatar_url,
            )
            # Use CreatorHistoryRead instead of WatchHistoryRead
            results.append(
                CreatorHistoryRead(
                    id=wh.id,
                    video_id=wh.video_id,
                    video=wh.video,
                    viewer=viewer_mini,
                    watch_duration=wh.watch_duration,
                    completion_rate=wh.completion_rate,
                    last_watched_at=wh.last_watched_at,
                    created_at=wh.created_at,
                )
            )
        return results

    @staticmethod
    def get_entry(
        db: Session,
        user_id: int,
        video_id: int,
    ) -> Optional[WatchHistory]:
        """Get a single history entry for a user + video."""
        return (
            db.query(WatchHistory)
            .filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == video_id,
            )
            .first()
        )

    @staticmethod
    def remove(db: Session, user_id: int, video_id: int) -> bool:
        """Remove a single history entry."""
        entry = (
            db.query(WatchHistory)
            .filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == video_id,
            )
            .first()
        )
        if entry is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="History entry not found",
            )
        db.delete(entry)
        db.commit()
        return True

    @staticmethod
    def clear(db: Session, user_id: int) -> int:
        """Clear all history entries for a user. Returns rows removed."""
        count = (
            db.query(WatchHistory)
            .filter(WatchHistory.user_id == user_id)
            .delete(synchronize_session=False)
        )
        db.commit()
        return count