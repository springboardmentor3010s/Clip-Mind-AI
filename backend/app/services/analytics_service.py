"""
Analytics Dashboard Module.

Aggregates real platform data only:
- Video counts, status breakdown, duration, and storage from Postgres,
  scoped to the current user's own uploads (content creator / educator)
  or platform-wide (administrator).
- Upload trend bucketed by week over the last 8 weeks.
- Top keywords aggregated from the Key Moments Detection Module's output
  in MongoDB — the closest real proxy we have to "content insights",
  since a video's keywords are extracted directly from its transcript.

There is no view count, watch-time, or traffic-source tracking anywhere
in the schema yet, so those metrics are intentionally left out rather
than mocked. Add that instrumentation first if they're needed later.
"""
from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.mongo import key_moments_collection
from app.models.user import User, UserRole
from app.models.video import Video, VideoStatus

WEEKS_OF_HISTORY = 8


def _scope_query(db: Session, current_user: User):
    query = db.query(Video)
    if current_user.role != UserRole.ADMINISTRATOR:
        query = query.filter(Video.owner_id == current_user.id)
    return query


def _week_bucket(dt: datetime) -> tuple[datetime, str]:
    """Bucket a datetime into the Monday of its week; label as 'Mon D'."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    monday = (dt - timedelta(days=dt.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return monday, monday.strftime("%b %d")


async def get_analytics_overview(db: Session, current_user: User) -> dict:
    scope = "platform" if current_user.role == UserRole.ADMINISTRATOR else "own"
    videos = _scope_query(db, current_user).all()

    total_videos = len(videos)
    completed = sum(1 for v in videos if v.status == VideoStatus.READY)
    processing = sum(1 for v in videos if v.status in (VideoStatus.PROCESSING, VideoStatus.UPLOADED))
    failed = sum(1 for v in videos if v.status == VideoStatus.FAILED)

    total_duration = sum(v.duration_seconds or 0 for v in videos)
    total_storage = sum(v.file_size_mb or 0 for v in videos)
    avg_duration = (total_duration / total_videos) if total_videos else 0.0
    completion_rate = (completed / total_videos * 100) if total_videos else 0.0

    status_counts = Counter(v.status.value for v in videos)
    status_breakdown = [{"status": s, "count": c} for s, c in status_counts.items()]

    # --- Uploads over time: trailing N weeks, Monday-bucketed ---
    now = datetime.now(timezone.utc)
    ordered_keys: list[datetime] = []
    labels: dict[datetime, str] = {}
    counts: dict[datetime, int] = {}
    cursor = now - timedelta(weeks=WEEKS_OF_HISTORY - 1)
    for _ in range(WEEKS_OF_HISTORY):
        key, label = _week_bucket(cursor)
        ordered_keys.append(key)
        labels[key] = label
        counts[key] = 0
        cursor += timedelta(weeks=1)

    for v in videos:
        if not v.created_at:
            continue
        key, _ = _week_bucket(v.created_at)
        if key in counts:
            counts[key] += 1

    uploads_over_time = [{"period": labels[k], "count": counts[k]} for k in ordered_keys]

    # --- Top keywords: aggregate from Key Moments Detection Module output ---
    mongo_filter = {} if scope == "platform" else {"owner_id": str(current_user.id)}
    keyword_counter: Counter = Counter()
    async for doc in key_moments_collection.find(mongo_filter, {"keywords": 1}):
        keyword_counter.update(doc.get("keywords", []))
    top_keywords = [{"keyword": k, "count": c} for k, c in keyword_counter.most_common(10)]

    return {
        "scope": scope,
        "total_videos": total_videos,
        "completed_videos": completed,
        "processing_videos": processing,
        "failed_videos": failed,
        "completion_rate": round(completion_rate, 1),
        "total_duration_seconds": total_duration,
        "total_duration_hours": round(total_duration / 3600, 2),
        "total_storage_mb": round(total_storage, 2),
        "avg_duration_seconds": round(avg_duration, 1),
        "status_breakdown": status_breakdown,
        "uploads_over_time": uploads_over_time,
        "top_keywords": top_keywords,
        "generated_at": now,
    }