"""
Analytics service: tracks video viewing analytics and statistics.
"""
import logging
from typing import Optional, Dict, Any

from sqlalchemy.orm import Session

from app.models.analytics import Analytics
from app.models.video import Video

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for video analytics tracking."""

    @staticmethod
    def get_analytics(db: Session, video_id: int) -> Optional[Analytics]:
        """Get analytics for a video."""
        return db.query(Analytics).filter(Analytics.video_id == video_id).first()

    @staticmethod
    def get_or_create_analytics(db: Session, video_id: int) -> Analytics:
        """Get or create analytics for a video."""
        analytics = db.query(Analytics).filter(Analytics.video_id == video_id).first()
        if not analytics:
            analytics = Analytics(video_id=video_id)
            db.add(analytics)
            db.commit()
            db.refresh(analytics)
        return analytics

    @staticmethod
    def record_view(
        db: Session,
        video_id: int,
        watch_duration: float = 0.0,
        is_unique: bool = True,
    ) -> Analytics:
        """
        Record a video view.

        Args:
            db: Database session.
            video_id: Video ID.
            watch_duration: How long the user watched (seconds).
            is_unique: Whether this is a unique viewer.

        Returns:
            Updated analytics record.
        """
        analytics = AnalyticsService.get_or_create_analytics(db, video_id)

        analytics.views += 1
        if is_unique:
            analytics.unique_viewers += 1
        analytics.total_watch_time += watch_duration

        # Update average watch duration
        if analytics.views > 0:
            analytics.avg_watch_duration = (
                analytics.total_watch_time / analytics.views
            )

        db.add(analytics)
        db.commit()
        db.refresh(analytics)

        return analytics

    @staticmethod
    def update_completion_rate(
        db: Session,
        video_id: int,
        video_duration: float,
        watched_duration: float,
    ) -> Analytics:
        """
        Update completion rate and total watch time.

        The frontend calls this every ~10 seconds of playback.
        watched_duration is the current playback position (seconds).

        Args:
            db: Database session.
            video_id: Video ID.
            video_duration: Total video duration.
            watched_duration: Current playback position (seconds).

        Returns:
            Updated analytics record.
        """
        analytics = AnalyticsService.get_or_create_analytics(db, video_id)

        if watched_duration > 0 and video_duration > 0:
            # Completion rate = how much of video was watched
            completion = min(watched_duration / video_duration, 1.0)

            # Rolling average for completion rate
            if analytics.views > 0:
                analytics.completion_rate = (
                    (analytics.completion_rate * (analytics.views - 1)) + completion
                ) / analytics.views
            else:
                analytics.completion_rate = completion

            # Accumulate watch time (frontend calls every ~10s of playback)
            analytics.total_watch_time += 10

            # Update average watch duration
            if analytics.views > 0:
                analytics.avg_watch_duration = (
                    analytics.total_watch_time / analytics.views
                )

        db.add(analytics)
        db.commit()
        db.refresh(analytics)

        return analytics

    @staticmethod
    def get_user_analytics_summary(db: Session, user_id: int) -> Dict[str, Any]:
        """Get aggregate analytics for all videos owned by a user."""
        videos = (
            db.query(Video)
            .filter(Video.user_id == user_id)
            .all()
        )

        total_views = 0
        total_unique_viewers = 0
        total_watch_time = 0.0
        total_videos = len(videos)
        processed_videos = 0

        for video in videos:
            analytics = AnalyticsService.get_analytics(db, video.id)
            if analytics:
                total_views += analytics.views
                total_unique_viewers += analytics.unique_viewers
                total_watch_time += analytics.total_watch_time
            if video.status == "processed":
                processed_videos += 1

        avg_completion = 0.0
        if total_videos > 0:
            completion_sum = 0.0
            count = 0
            for video in videos:
                analytics = AnalyticsService.get_analytics(db, video.id)
                if analytics:
                    completion_sum += analytics.completion_rate
                    count += 1
            avg_completion = completion_sum / max(count, 1)

        return {
            "total_videos": total_videos,
            "processed_videos": processed_videos,
            "total_views": total_views,
            "total_unique_viewers": total_unique_viewers,
            "total_watch_time_seconds": total_watch_time,
            "avg_completion_rate": round(avg_completion * 100, 1),
            "avg_views_per_video": round(total_views / max(total_videos, 1), 1),
        }

    @staticmethod
    def get_all_analytics_summary(db: Session) -> Dict[str, Any]:
        """Get aggregate analytics across all videos (admin)."""
        videos = db.query(Video).all()

        total_views = 0
        total_unique_viewers = 0
        total_watch_time = 0.0
        total_videos = len(videos)
        total_users_with_videos = len(set(v.user_id for v in videos))

        for video in videos:
            analytics = AnalyticsService.get_analytics(db, video.id)
            if analytics:
                total_views += analytics.views
                total_unique_viewers += analytics.unique_viewers
                total_watch_time += analytics.total_watch_time

        return {
            "total_videos": total_videos,
            "total_users_with_videos": total_users_with_videos,
            "total_views": total_views,
            "total_unique_viewers": total_unique_viewers,
            "total_watch_time_hours": round(total_watch_time / 3600, 2),
            "avg_views_per_video": round(total_views / max(total_videos, 1), 1),
        }