"""
Educator router: classroom analytics and student engagement endpoints.

Provides aggregate "classroom" views of an educator's content and the
metrics of the students/learners engaging with it. Access is restricted to
the Educator and Administrator roles.
"""
import csv
import io
import logging
from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import require_role
from app.database.database import get_db
from app.models.user import User
from app.models.video import Video
from app.models.watch_history import WatchHistory
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/educator",
    tags=["Educator Analytics"],
)

educator_dep = Depends(require_role("Educator", "Administrator"))


def _get_educator_videos(db: Session, user_id: int) -> list:
    """All videos owned by the educator, newest first."""
    return (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .order_by(Video.created_at.desc())
        .all()
    )


def _pct(value: float, digits: int = 1) -> float:
    return round(value * 100, digits)


# ---------------------------------------------------------
# Classroom content analytics
# ---------------------------------------------------------

@router.get("/analytics")
def get_educator_analytics(
    current_user=educator_dep,
    db: Session = Depends(get_db),
):
    """
    Aggregate content analytics across the educator's classroom videos:
    total views, unique viewers, watch time, completion and per-video stats.

    Requires Educator or Administrator role.
    """
    videos = _get_educator_videos(db, current_user.id)

    total_views = 0
    total_unique_viewers = 0
    total_watch_time = 0.0
    completion_sum = 0.0
    completion_count = 0

    video_stats = []
    for video in videos:
        analytics = AnalyticsService.get_analytics(db, video.id)
        views = analytics.views if analytics else 0
        unique = analytics.unique_viewers if analytics else 0
        watch = analytics.total_watch_time if analytics else 0.0
        completion = analytics.completion_rate if analytics else 0.0

        total_views += views
        total_unique_viewers += unique
        total_watch_time += watch
        if analytics:
            completion_sum += completion
            completion_count += 1

        video_stats.append(
            {
                "id": video.id,
                "title": video.title,
                "status": video.status,
                "is_published": video.is_published,
                "duration": video.duration or 0,
                "views": views,
                "unique_viewers": unique,
                "watch_time_seconds": round(watch, 1),
                "completion_rate": _pct(completion),
            }
        )

    return {
        "total_videos": len(videos),
        "published_videos": sum(1 for v in videos if v.is_published),
        "total_views": total_views,
        "total_unique_viewers": total_unique_viewers,
        "total_watch_time_seconds": round(total_watch_time, 1),
        "avg_completion_rate": _pct(completion_sum / completion_count) if completion_count else 0,
        "avg_views_per_video": round(total_views / max(len(videos), 1), 1),
        "videos": video_stats,
    }


# ---------------------------------------------------------
# Student engagement metrics
# ---------------------------------------------------------

@router.get("/analytics/engagement")
def get_student_engagement(
    current_user=educator_dep,
    db: Session = Depends(get_db),
):
    """
    Monitor how students are engaging with the educator's content:
    per-video engagement (learners, average completion, watch time) and a
    per-learner breakdown (videos watched, watch time, completion, activity).

    Requires Educator or Administrator role.
    """
    videos = _get_educator_videos(db, current_user.id)
    video_ids = [v.id for v in videos]

    # Per-video engagement
    per_video = []
    for video in videos:
        history_rows = (
            db.query(WatchHistory)
            .filter(WatchHistory.video_id == video.id)
            .all()
        )
        learners = {row.user_id for row in history_rows}
        avg_completion = (
            sum(row.completion_rate for row in history_rows) / len(history_rows)
            if history_rows
            else 0.0
        )
        avg_watch = (
            sum(row.watch_duration for row in history_rows) / len(history_rows)
            if history_rows
            else 0.0
        )
        analytics = AnalyticsService.get_analytics(db, video.id)
        per_video.append(
            {
                "video_id": video.id,
                "title": video.title,
                "watches": len(history_rows),
                "learners": len(learners),
                "avg_completion_rate": _pct(avg_completion),
                "avg_watch_duration_seconds": round(avg_watch, 1),
                "views": analytics.views if analytics else 0,
                "completion_rate": _pct(analytics.completion_rate) if analytics else 0,
            }
        )

    # Aggregate per learner
    learner_stats = defaultdict(
        lambda: {
            "videos_watched": 0,
            "total_watch_time_seconds": 0.0,
            "completion_sum": 0.0,
            "last_active": None,
        }
    )

    if video_ids:
        history = (
            db.query(WatchHistory)
            .filter(WatchHistory.video_id.in_(video_ids))
            .all()
        )
        for row in history:
            stats = learner_stats[row.user_id]
            stats["videos_watched"] += 1
            stats["total_watch_time_seconds"] += row.watch_duration or 0.0
            stats["completion_sum"] += row.completion_rate or 0.0
            if row.last_watched_at is not None:
                if stats["last_active"] is None or row.last_watched_at > stats["last_active"]:
                    stats["last_active"] = row.last_watched_at

    users = (
        db.query(User).filter(User.id.in_(list(learner_stats.keys()))).all()
        if learner_stats
        else []
    )
    user_map = {u.id: u for u in users}

    now = datetime.utcnow()
    active_window = now - timedelta(days=7)

    learners = []
    active_learners = 0
    for user_id, stats in learner_stats.items():
        user = user_map.get(user_id)
        try:
            last = stats["last_active"]
            if last is not None and hasattr(last, "replace"):
                last = last.replace(tzinfo=None)
        except Exception:
            last = None
        if last is not None and last >= active_window:
            active_learners += 1
        learners.append(
            {
                "user_id": user_id,
                "full_name": user.full_name if user else "Unknown",
                "username": user.username if user else "unknown",
                "videos_watched": stats["videos_watched"],
                "total_watch_time_seconds": round(stats["total_watch_time_seconds"], 1),
                "avg_completion_rate": _pct(
                    stats["completion_sum"] / stats["videos_watched"]
                )
                if stats["videos_watched"]
                else 0,
                "last_active": last.isoformat() if last else None,
            }
        )

    learners.sort(key=lambda x: x["total_watch_time_seconds"], reverse=True)

    return {
        "total_learners": len(learners),
        "active_learners": active_learners,
        "total_watch_events": sum(v["watches"] for v in per_video),
        "per_video": per_video,
        "learners": learners,
    }


# ---------------------------------------------------------
# Student engagement CSV export
# ---------------------------------------------------------

@router.get("/analytics/engagement/export")
def export_student_engagement(
    current_user=educator_dep,
    db: Session = Depends(get_db),
):
    """
    Download the learner engagement metrics as a CSV file.

    Requires Educator or Administrator role.
    """
    payload = get_student_engagement(current_user, db)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "user_id",
            "full_name",
            "username",
            "videos_watched",
            "total_watch_time_seconds",
            "avg_completion_rate",
            "last_active",
        ]
    )
    for row in payload["learners"]:
        writer.writerow(
            [
                row["user_id"],
                row["full_name"],
                row["username"],
                row["videos_watched"],
                row["total_watch_time_seconds"],
                row["avg_completion_rate"],
                row["last_active"] or "",
            ]
        )

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=student_engagement.csv",
        },
    )