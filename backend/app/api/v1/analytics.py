"""
Real analytics routes — computes usage insights from actual
video, transcript, summary, and event data (no dummy data).
"""

from collections import Counter
from datetime import datetime
from fastapi import APIRouter, Depends  # type: ignore[import]
from fastapi.responses import StreamingResponse, PlainTextResponse  # type: ignore[import]
from io import BytesIO
from sqlalchemy.orm import Session  # type: ignore[import]
from app.db.postgres import get_db
from app.db.mongodb import transcripts_collection
from app.models.video import Video
from app.models.analytics import AnalyticsEvent
from app.models.user import User
from app.api.deps import get_current_user
from app.services.keywords import extract_keywords

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    videos = db.query(Video).filter(Video.user_id == current_user.user_id).all()

    # Watch time by video (using duration as a proxy, real "watch time" would need player tracking)
    watch_time_data = [
        {"title": v.title[:20], "duration_seconds": v.duration_seconds or 0}
        for v in videos[:8]
    ]

    # Engagement by event type
    events = db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == current_user.user_id).all()
    event_counts = Counter(e.event_type for e in events)

    # Top content insights — aggregate keywords across all transcripts
    cursor = transcripts_collection.find({"user_id": str(current_user.user_id)})
    all_text = ""
    async for doc in cursor:
        all_text += " " + doc.get("text", "")

    top_keywords = extract_keywords(all_text, top_n=6) if all_text.strip() else []

    return {
        "watch_time_data": watch_time_data,
        "event_counts": dict(event_counts),
        "top_keywords": top_keywords,
        "total_events": len(events),
    }


@router.get("/usage-report")
async def get_usage_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    videos = db.query(Video).filter(Video.user_id == current_user.user_id).all()
    total_videos = len(videos)
    total_duration = sum(v.duration_seconds or 0 for v in videos)
    total_size = round(sum(v.file_size_mb for v in videos), 2)

    transcript_count = await transcripts_collection.count_documents({"user_id": str(current_user.user_id)})

    from app.db.mongodb import summaries_collection, key_moments_collection
    summary_count = await summaries_collection.count_documents({"user_id": str(current_user.user_id)})
    keymoments_count = await key_moments_collection.count_documents({"user_id": str(current_user.user_id)})

    return {
        "total_videos": total_videos,
        "total_duration_seconds": total_duration,
        "total_size_mb": total_size,
        "transcripts_generated": transcript_count,
        "summaries_generated": summary_count,
        "keymoments_generated": keymoments_count,
    }

@router.get("/report/download-pdf")
async def download_analytics_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.services.pdf_report import generate_analytics_report

    overview_data = await get_analytics_overview(db, current_user)
    report_data = await get_usage_report(db, current_user)

    pdf_bytes = generate_analytics_report(
        report=report_data,
        top_keywords=overview_data["top_keywords"],
        event_counts=overview_data["event_counts"],
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="clipmind_analytics_report.pdf"'},
    )


@router.get("/report/download-txt")
async def download_analytics_txt(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    overview_data = await get_analytics_overview(db, current_user)
    report_data = await get_usage_report(db, current_user)

    lines = [
        "ClipMind AI — Content Insights & Usage Report",
        "=" * 50,
        "",
        "USAGE SUMMARY",
        f"Total Videos: {report_data['total_videos']}",
        f"Total Watch Duration (seconds): {report_data['total_duration_seconds']}",
        f"Storage Used (MB): {report_data['total_size_mb']}",
        f"Transcripts Generated: {report_data['transcripts_generated']}",
        f"Summaries Generated: {report_data['summaries_generated']}",
        f"Key Moments Generated: {report_data['keymoments_generated']}",
        "",
        "ENGAGEMENT BY EVENT TYPE",
    ]
    for k, v in overview_data["event_counts"].items():
        lines.append(f"{k.replace('_', ' ').title()}: {v}")

    lines.append("")
    lines.append("TOP CONTENT INSIGHTS (KEYWORDS)")
    for kw in overview_data["top_keywords"]:
        lines.append(f"{kw['word']}: {kw['count']} mentions")

    content = "\n".join(lines)
    return PlainTextResponse(
        content,
        headers={"Content-Disposition": 'attachment; filename="clipmind_analytics_report.txt"'},
    )

@router.get("/classroom")
async def get_classroom_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException, status
    from datetime import timedelta
    from app.db.mongodb import mongo_db

    if current_user.role.value != "educator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Educators can view classroom analytics.",
        )

    my_videos = db.query(Video).filter(Video.user_id == current_user.user_id).all()
    my_video_ids = [v.video_id for v in my_videos]

    if not my_video_ids:
        return {
            "total_videos": 0,
            "total_student_views": 0,
            "unique_students": 0,
            "per_video": [],
            "top_video": None,
            "engagement_trend": [],
            "recent_activity": [],
            "avg_views_per_video": 0,
        }

    events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.video_id.in_(my_video_ids))
        .filter(AnalyticsEvent.user_id != current_user.user_id)
        .order_by(AnalyticsEvent.event_timestamp.desc())
        .all()
    )

    view_events = [e for e in events if e.event_type == "view"]
    unique_students = {e.user_id for e in events}

    # Shared-link views (anonymous, no login) — from the shares collection
    shares_collection = mongo_db["shares"]
    share_views_by_video = {}
    cursor = shares_collection.find({"user_id": str(current_user.user_id)})
    async for doc in cursor:
        vid = doc.get("video_id")
        share_views_by_video[vid] = share_views_by_video.get(vid, 0) + doc.get("views", 0)

    per_video = []
    for v in my_videos:
        video_events = [e for e in events if e.video_id == v.video_id]
        video_views = [e for e in video_events if e.event_type == "view"]
        video_students = {e.user_id for e in video_events}
        shared_views = share_views_by_video.get(str(v.video_id), 0)
        per_video.append({
            "video_id": str(v.video_id),
            "title": v.title,
            "views": len(video_views) + shared_views,
            "unique_students": len(video_students),
            "total_engagement_events": len(video_events),
        })

    per_video.sort(key=lambda x: x["views"], reverse=True)

    total_shared_views = sum(share_views_by_video.values())
    total_student_views = len(view_events) + total_shared_views

    top_video = per_video[0] if per_video and per_video[0]["views"] > 0 else None

    # Engagement trend — last 14 days, count of logged-in events per day
    today = datetime.utcnow().date()
    trend_map = {}
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        trend_map[day.isoformat()] = 0
    for e in events:
        day_key = e.event_timestamp.date().isoformat()
        if day_key in trend_map:
            trend_map[day_key] += 1
    engagement_trend = [{"date": k, "count": v} for k, v in trend_map.items()]

    # Recent activity feed — last 10 logged-in events, with student username
    recent_activity = []
    for e in events[:10]:
        student = db.query(User).filter(User.user_id == e.user_id).first()
        video = next((v for v in my_videos if v.video_id == e.video_id), None)
        recent_activity.append({
            "username": student.username if student else "Unknown",
            "event_type": e.event_type,
            "video_title": video.title if video else "Unknown video",
            "timestamp": e.event_timestamp,
        })

    avg_views = round(total_student_views / len(my_videos), 1) if my_videos else 0

    return {
        "total_videos": len(my_videos),
        "total_student_views": total_student_views,
        "unique_students": len(unique_students),
        "per_video": per_video,
        "top_video": top_video,
        "engagement_trend": engagement_trend,
        "recent_activity": recent_activity,
        "avg_views_per_video": avg_views,
    }


@router.get("/trending-topics")
async def get_trending_topics(current_user: User = Depends(get_current_user)):
    """
    Aggregates keywords across ALL transcripts on the platform
    (not just the current user's), to surface what's trending overall.
    """
    from app.services.keywords import extract_keywords
    from app.db.mongodb import summaries_collection

    cursor = transcripts_collection.find({})
    all_text = ""
    video_titles = {}
    async for doc in cursor:
        all_text += " " + doc.get("text", "")
        video_titles[doc.get("video_id")] = doc.get("video_title", "Video")

    trending = extract_keywords(all_text, top_n=12) if all_text.strip() else []

    total_videos_with_content = await transcripts_collection.count_documents({})
    total_summaries = await summaries_collection.count_documents({})

    return {
        "trending_keywords": trending,
        "total_videos_analyzed": total_videos_with_content,
        "total_summaries": total_summaries,
    }