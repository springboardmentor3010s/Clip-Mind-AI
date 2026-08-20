"""
Analytics router: endpoints for video analytics.
"""
import re
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.analytics import AnalyticsRead, AnalyticsUpdate, RichAnalyticsRead
from app.services.analytics_service import AnalyticsService
from app.services.video_service import VideoService
from app.services.keyword_service import KeywordService
from app.services.ai_insight_service import AIInsightService
from app.auth.dependencies import get_current_user, require_role
from app.models.key_moment import KeyMoment


router = APIRouter(
    prefix="/api",
    tags=["Analytics"],
)


def _count_words(text: str | None) -> int:
    """Count words in text using regex."""
    if not text:
        return 0
    matches = re.findall(r'\w+', text)
    return len(matches)


@router.get("/videos/{video_id}/analytics", response_model=RichAnalyticsRead)
def get_video_analytics(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get analytics for a specific video, including AI content statistics
    computed from the video's transcript, summary, and key moments.

    Requires authentication. Accessible to the video owner or any user
    who can view the video (i.e. published videos are visible to all).
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )

    analytics = AnalyticsService.get_or_create_analytics(db, video_id)

    # Compute AI content statistics from the video's relationships
    transcript_word_count = 0
    summary_word_count = 0
    key_moment_count = 0
    average_confidence = 0
    bookmark_count = 0
    compression_ratio = 0

    # Transcript words
    if video.transcript and video.transcript.transcript:
        transcript_word_count = _count_words(video.transcript.transcript)

    # Summary words (use detailed_summary for consistency with
    # the evaluation service and AI insight service)
    if video.summary and video.summary.detailed_summary:
        summary_word_count = _count_words(video.summary.detailed_summary)

    # Compression ratio — matches EvaluationService formula:
    # percentage of the transcript that was compressed/removed
    # (higher = more compression), not the percentage retained.
    if transcript_word_count > 0:
        compression_ratio = round((1 - (summary_word_count / transcript_word_count)) * 100)

    # Keyword count from transcript
    keyword_count = 0
    if video.transcript and video.transcript.transcript:
        try:
            ks = KeywordService()
            keywords_data = ks.extract_keywords(video.transcript.transcript, top_n=100)
            keyword_count = len(keywords_data)
        except Exception:
            keyword_count = 0

    # Key moments count and average confidence
    key_moments = db.query(KeyMoment).filter(KeyMoment.video_id == video_id).all()
    key_moment_count = len(key_moments)
    if key_moment_count > 0:
        total_confidence = sum(
            (km.confidence or 0) for km in key_moments
            if isinstance(km.confidence, (int, float))
        )
        average_confidence = round((total_confidence / key_moment_count) * 100)

    # Generate AI insights using the AIInsightService
    insights = AIInsightService.generate(
        video,
        video.transcript,
        video.summary,
        key_moments,
    )

    # Build the rich analytics response
    rich = RichAnalyticsRead(
        id=analytics.id,
        video_id=analytics.video_id,
        views=analytics.views,
        watch_time=analytics.watch_time,
        unique_viewers=analytics.unique_viewers,
        avg_watch_duration=analytics.avg_watch_duration,
        completion_rate=analytics.completion_rate,
        total_watch_time=analytics.total_watch_time,
        created_at=analytics.created_at,
        updated_at=analytics.updated_at,
        transcript_word_count=transcript_word_count,
        summary_word_count=summary_word_count,
        compression_ratio=compression_ratio,
        key_moment_count=key_moment_count,
        average_confidence=average_confidence,
        bookmark_count=bookmark_count,
        keyword_count=keyword_count,
        speaking_speed=insights["speaking_speed"],
        reading_time=insights["reading_time"],
        processing_score=insights["processing_score"],
        video_quality=insights["video_quality"],
        summary_quality=insights["summary_quality"],
        transcript_density=insights["transcript_density"],
        top_keywords=[
            {"keyword": k, "count": c}
            for k, c in insights["top_keywords"]
        ],
    )
    return rich


@router.put("/videos/{video_id}/analytics/view", response_model=AnalyticsRead)
def record_view(
    video_id: int,
    watch_duration: float = Query(0.0, ge=0),
    is_unique: bool = Query(True),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record a video view for analytics.

    Requires authentication.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    analytics = AnalyticsService.record_view(
        db, video_id, watch_duration=watch_duration, is_unique=is_unique
    )
    return analytics


@router.put("/videos/{video_id}/analytics/completion", response_model=AnalyticsRead)
def update_completion(
    video_id: int,
    watched_duration: float = Query(..., ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update watch completion rate for a video.

    Requires authentication.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    video_duration = video.duration or 1.0
    analytics = AnalyticsService.update_completion_rate(
        db, video_id, video_duration, watched_duration
    )
    return analytics


@router.get("/analytics/summary")
def get_analytics_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get analytics summary for the current user's videos.

    Requires authentication.
    """
    summary = AnalyticsService.get_user_analytics_summary(db, current_user.id)
    return summary


@router.get("/admin/analytics/summary")
def get_admin_analytics_summary(
    current_user=Depends(require_role("Administrator")),
    db: Session = Depends(get_db),
):
    """
    Get aggregate analytics across all videos (admin only).

    Requires Administrator role.
    """
    summary = AnalyticsService.get_all_analytics_summary(db)
    return summary