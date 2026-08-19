from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.core.dependencies import get_db, get_current_user
from app.core.cache import cache_get, cache_set
from app.models.analytics import AnalyticsEvent
from app.models.user import User
from app.schemas.analytics import AnalyticsEventCreate, AnalyticsEventResponse, DashboardMetricsResponse, VideoAnalyticsResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/event", response_model=AnalyticsEventResponse)
def track_event(
    req: AnalyticsEventCreate, 
    db: Session = Depends(get_db),
    # Optional authentication for tracking anonymous views
    current_user: User = Depends(get_current_user)
):
    # Depending on auth implementation, we might wrap get_current_user in a way that allows None
    # For now, let's assume it works or we just use user_id if available.
    user_id = current_user.id if current_user else None
    
    event = AnalyticsEvent(
        video_id=req.video_id,
        user_id=user_id,
        event_type=req.event_type,
        metadata_val=req.metadata_val
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

DASHBOARD_CACHE_KEY = "analytics:dashboard"
DASHBOARD_CACHE_TTL_SECONDS = 10

@router.get("/dashboard", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cached = cache_get(DASHBOARD_CACHE_KEY)
    if cached:
        return cached

    from app.models.video import Video
    from app.models.transcript import Transcript
    from app.models.key_moment import KeyMoment

    # 1. Total Videos uploaded
    total_videos_count = db.query(Video).count()

    # 2. Total Views
    total_views = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_type == "video_view").count()

    # 3. Total Exports
    total_exports = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_type == "export_txt").count()

    # 4. Processing Times
    processing_events = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_type == "processing_time").all()
    avg_processing = 0.0
    if processing_events:
        total_secs = sum([float(e.metadata_val or 0) for e in processing_events])
        avg_processing = total_secs / len(processing_events)

    # 5. Simple Timeline (group by date)
    timeline_query = db.query(
        func.date(AnalyticsEvent.created_at).label('date'),
        func.count(AnalyticsEvent.id).label('count')
    ).group_by(func.date(AnalyticsEvent.created_at)).all()

    timeline = [{"date": str(t.date), "count": t.count} for t in timeline_query]

    # 6/7. Yesterday/today + 8-day rolling series, all from 3 grouped queries
    # instead of ~26 individual per-day COUNT(*) round trips.
    today = date.today()
    yesterday = today - timedelta(days=1)
    window_start = today - timedelta(days=7)

    def _counts_by_date(query) -> dict:
        return {str(row[0]): row[1] for row in query.all()}

    uploads_by_date = _counts_by_date(
        db.query(func.date(Video.created_at), func.count(Video.id))
        .filter(func.date(Video.created_at) >= window_start)
        .group_by(func.date(Video.created_at))
    )
    downloads_by_date = _counts_by_date(
        db.query(func.date(AnalyticsEvent.created_at), func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.event_type == "export_txt", func.date(AnalyticsEvent.created_at) >= window_start)
        .group_by(func.date(AnalyticsEvent.created_at))
    )
    views_by_date = _counts_by_date(
        db.query(func.date(AnalyticsEvent.created_at), func.count(AnalyticsEvent.id))
        .filter(AnalyticsEvent.event_type == "video_view", func.date(AnalyticsEvent.created_at) >= window_start)
        .group_by(func.date(AnalyticsEvent.created_at))
    )

    videos_uploaded_today = uploads_by_date.get(str(today), 0)
    videos_uploaded_yesterday = uploads_by_date.get(str(yesterday), 0)
    downloads_today = downloads_by_date.get(str(today), 0)
    downloads_yesterday = downloads_by_date.get(str(yesterday), 0)

    rolling_8_day = []
    for i in range(7, -1, -1):
        day_str = str(today - timedelta(days=i))
        rolling_8_day.append({
            "date": day_str,
            "uploads": uploads_by_date.get(day_str, 0),
            "downloads": downloads_by_date.get(day_str, 0),
            "views": views_by_date.get(day_str, 0),
        })

    # 8. Extra aggregate stats — select only the keywords column, not full rows
    keyword_lists = db.query(Transcript.keywords).filter(Transcript.keywords.isnot(None)).all()
    total_keywords = sum(len(kw[0]) for kw in keyword_lists if kw[0])
    total_key_moments = db.query(KeyMoment).count()

    status_rows = db.query(Video.status, func.count(Video.id)).group_by(Video.status).all()
    videos_by_status = {str(s.value if hasattr(s, "value") else s): c for s, c in status_rows}

    avg_views_per_video = (total_views / total_videos_count) if total_videos_count else 0.0

    result = {
        "total_videos": total_videos_count,
        "total_views": total_views,
        "total_exports": total_exports,
        "avg_processing_time_seconds": avg_processing,
        "events_timeline": timeline,
        "videos_uploaded_today": videos_uploaded_today,
        "videos_uploaded_yesterday": videos_uploaded_yesterday,
        "downloads_today": downloads_today,
        "downloads_yesterday": downloads_yesterday,
        "rolling_8_day": rolling_8_day,
        "total_keywords": int(total_keywords),
        "total_key_moments": total_key_moments,
        "videos_by_status": videos_by_status,
        "avg_views_per_video": avg_views_per_video,
    }
    cache_set(DASHBOARD_CACHE_KEY, result, ttl_seconds=DASHBOARD_CACHE_TTL_SECONDS)
    return result

INSIGHTS_CACHE_KEY = "analytics:insights"
INSIGHTS_CACHE_TTL_SECONDS = 60

@router.get("/insights")
def get_content_insights(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Account-wide content insights: most common topics, storage footprint, and
    average video length — the 'Content Insights & Usage Reports' Milestone 3/4 deliverable."""
    cached = cache_get(INSIGHTS_CACHE_KEY)
    if cached:
        return cached

    from app.models.video import Video
    from app.models.transcript import Transcript
    from app.services.key_moments import extract_keywords

    stats = db.query(
        func.sum(Video.file_size_bytes).label("total_bytes"),
        func.avg(Video.duration_seconds).label("avg_duration"),
    ).first()
    total_bytes = stats.total_bytes or 0
    avg_duration = stats.avg_duration or 0

    transcript_texts = db.query(Transcript.text).filter(Transcript.text.isnot(None)).all()
    full_text = " ".join(t[0] for t in transcript_texts if t[0])
    top_keywords = extract_keywords(full_text, top_n=8) if full_text else []

    result = {
        "most_common_topics": top_keywords,
        "total_storage_used_mb": round(total_bytes / (1024 * 1024), 2),
        "average_video_length_seconds": round(avg_duration, 1),
    }
    cache_set(INSIGHTS_CACHE_KEY, result, ttl_seconds=INSIGHTS_CACHE_TTL_SECONDS)
    return result

@router.get("/video/{video_id}", response_model=VideoAnalyticsResponse)
def get_video_analytics(video_id: int, db: Session = Depends(get_db)):
    """Per-video content insights: views, exports, keywords, key moments, processing time."""
    from app.models.transcript import Transcript
    from app.models.key_moment import KeyMoment

    events = db.query(AnalyticsEvent).filter(AnalyticsEvent.video_id == video_id).all()

    views = sum(1 for e in events if e.event_type == "video_view")
    unique_viewers = len({e.user_id for e in events if e.event_type == "video_view" and e.user_id is not None})
    export_events = [e for e in events if e.event_type == "export_txt"]
    exports_by_type: dict = {}
    for e in export_events:
        key = e.metadata_val or "unknown"
        exports_by_type[key] = exports_by_type.get(key, 0) + 1

    processing_events = [e for e in events if e.event_type == "processing_time"]
    processing_time_seconds = float(processing_events[-1].metadata_val) if processing_events else None

    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    keyword_count = len(transcript.keywords) if transcript and transcript.keywords else 0

    key_moment_count = db.query(KeyMoment).filter(KeyMoment.video_id == video_id).count()

    return {
        "video_id": video_id,
        "views": views,
        "unique_viewers": unique_viewers,
        "exports": len(export_events),
        "exports_by_type": exports_by_type,
        "keyword_count": keyword_count,
        "key_moment_count": key_moment_count,
        "processing_time_seconds": processing_time_seconds
    }

