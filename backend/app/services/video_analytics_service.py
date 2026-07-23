"""
Analytics Dashboard Module — per-video watch tracking.

Views and watch time aren't tracked anywhere else in the schema, so this
module owns that instrumentation: one Mongo document per (video, viewer)
pair in `video_views`, upserted as the player reports progress. Postgres
stays untouched — this is activity/content data, same category as
transcripts, summaries, and bookmarks elsewhere in the app.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.mongo import video_views_collection
from app.models.user import User
from app.models.video import Video
from app.schemas.video_analytics import ViewPing
from app.services.video_service import get_video_or_404

RETENTION_MARKS = (0.25, 0.5, 0.75, 1.0)


async def record_view(db: Session, video_id, current_user: User, payload: ViewPing) -> None:
    video = get_video_or_404(db, video_id, current_user, require_owner=False)
    now = datetime.now(timezone.utc)

    existing = await video_views_collection.find_one(
        {"video_id": str(video.id), "viewer_id": str(current_user.id)}
    )

    watched_seconds = max(payload.watched_seconds, (existing or {}).get("watched_seconds", 0))

    update = {
        "$set": {
            "video_id": str(video.id),
            "viewer_id": str(current_user.id),
            "viewer_name": current_user.full_name,
            "watched_seconds": watched_seconds,
            "last_watched_at": now,
        },
        "$setOnInsert": {"first_watched_at": now},
        "$inc": {"view_count": 1 if payload.session_start else 0},
    }

    await video_views_collection.update_one(
        {"video_id": str(video.id), "viewer_id": str(current_user.id)},
        update,
        upsert=True,
    )
    # New docs need view_count seeded even without a session_start ping
    # (e.g. a page refresh mid-playback that only sends progress pings).
    await video_views_collection.update_one(
        {"video_id": str(video.id), "viewer_id": str(current_user.id), "view_count": {"$exists": False}},
        {"$set": {"view_count": 1}},
    )


async def get_video_analytics(db: Session, video_id, current_user: User) -> dict:
    video: Video = get_video_or_404(db, video_id, current_user)
    duration = video.duration_seconds or 0

    views = [doc async for doc in video_views_collection.find({"video_id": str(video.id)})]

    view_count = sum(v.get("view_count", 1) for v in views)
    unique_viewers = len(views)
    total_watch_time = sum(v.get("watched_seconds", 0) for v in views)
    avg_watch_time = (total_watch_time / unique_viewers) if unique_viewers else 0.0

    completion_pcts = [
        min(v.get("watched_seconds", 0) / duration, 1.0) * 100 if duration else 0.0
        for v in views
    ]
    completion_rate = (sum(completion_pcts) / len(completion_pcts)) if completion_pcts else 0.0

    retention = []
    for mark in RETENTION_MARKS:
        threshold_seconds = duration * mark
        reached = sum(1 for v in views if v.get("watched_seconds", 0) >= threshold_seconds) if duration else 0
        retention.append({"label": f"{int(mark * 100)}%", "viewers_reached": reached})

    audience = sorted(
        [
            {
                "viewer_id": v["viewer_id"],
                "viewer_name": v.get("viewer_name", "Unknown"),
                "view_count": v.get("view_count", 1),
                "watched_seconds": v.get("watched_seconds", 0),
                "completion_pct": round(min(v.get("watched_seconds", 0) / duration, 1.0) * 100, 1) if duration else 0.0,
                "last_watched_at": v.get("last_watched_at"),
            }
            for v in views
        ],
        key=lambda a: a["last_watched_at"],
        reverse=True,
    )

    return {
        "video_id": str(video.id),
        "view_count": view_count,
        "unique_viewers": unique_viewers,
        "total_watch_time_seconds": round(total_watch_time, 1),
        "avg_watch_time_seconds": round(avg_watch_time, 1),
        "completion_rate": round(completion_rate, 1),
        "retention": retention,
        "audience": audience,
    }