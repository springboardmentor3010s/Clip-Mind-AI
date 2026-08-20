"""
Reports router: endpoints for downloading PDF and CSV reports.
"""
import re
from types import SimpleNamespace

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.video import Video
from app.models.summary import Summary
from app.models.transcript import Transcript
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword
from app.services.analytics_service import AnalyticsService
from app.services.keyword_service import KeywordService
from app.services.report_service import ReportService


router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


def _count_words(text: str | None) -> int:
    """Count words in text using regex."""
    if not text:
        return 0
    matches = re.findall(r'\w+', text)
    return len(matches)


def _enrich_analytics(analytics, video, transcript, summary, key_moments):
    """
    Attach computed AI content statistics to the analytics object,
    mirroring the computation in the analytics router so the report
    PDF shows the exact same data as the analytics page.
    """
    # Transcript / summary word counts
    transcript_word_count = 0
    summary_word_count = 0
    if transcript and transcript.transcript:
        transcript_word_count = _count_words(transcript.transcript)
    if summary and summary.detailed_summary:
        summary_word_count = _count_words(summary.detailed_summary)

    # Compression ratio — matches EvaluationService formula:
    # percentage of the transcript that was compressed/removed
    # (higher = more compression), not the percentage retained.
    compression_ratio = 0
    if transcript_word_count > 0:
        compression_ratio = round(
            (1 - (summary_word_count / transcript_word_count)) * 100
        )

    # Keyword count (same method as analytics router)
    keyword_count = 0
    if transcript and transcript.transcript:
        try:
            ks = KeywordService()
            keywords_data = ks.extract_keywords(
                transcript.transcript, top_n=100
            )
            keyword_count = len(keywords_data)
        except Exception:
            keyword_count = 0

    # Key moment count and average confidence
    key_moment_count = len(key_moments)
    average_confidence = 0
    if key_moment_count > 0:
        total_confidence = sum(
            (km.confidence or 0) for km in key_moments
            if isinstance(km.confidence, (int, float))
        )
        average_confidence = round(
            (total_confidence / key_moment_count) * 100
        )

    # If analytics doesn't exist, create a lightweight stand-in
    if analytics is None:
        analytics = SimpleNamespace(
            id=0,
            video_id=video.id,
            views=0,
            watch_time=0,
            unique_viewers=0,
            avg_watch_duration=0,
            completion_rate=0,
            total_watch_time=0,
            created_at=None,
            updated_at=None,
        )

    # Attach computed fields so report_service can use them
    setattr(analytics, "keyword_count", keyword_count)
    setattr(analytics, "compression_ratio", compression_ratio)
    setattr(analytics, "key_moment_count", key_moment_count)
    setattr(analytics, "average_confidence", average_confidence)

    return analytics


@router.get("/{video_id}/pdf")
def export_pdf(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a professionally formatted PDF report for a video.

    The report includes video details, transcript statistics, summaries,
    analytics, and key moments.

    Requires authentication and ownership of the video.
    """
    video = db.query(Video).filter(Video.id == video_id).first()

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video's report",
        )

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id)
        .first()
    )

    key_moments = (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video_id)
        .all()
    )

    keywords = (
        db.query(Keyword)
        .filter(Keyword.video_id == video_id)
        .order_by(Keyword.count.desc())
        .all()
    )

    analytics = AnalyticsService.get_analytics(db, video_id)

    # Enrich analytics with computed AI content statistics so the
    # report PDF shows the exact same data as the analytics page.
    analytics = _enrich_analytics(
        analytics, video, transcript, summary, key_moments
    )

    pdf = ReportService.generate_pdf(
        video,
        transcript,
        summary,
        analytics,
        key_moments,
        keywords,
    )

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f"attachment; filename=video_{video_id}_report.pdf"
            )
        },
    )


@router.get("/{video_id}/csv")
def export_csv(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a CSV file containing the detected key moments for a video.

    Requires authentication and ownership of the video.
    """
    video = db.query(Video).filter(Video.id == video_id).first()

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video's report",
        )

    key_moments = (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video_id)
        .all()
    )

    csv_file = ReportService.generate_key_moments_csv(key_moments)

    return StreamingResponse(
        iter([csv_file.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f"attachment; filename=key_moments_{video_id}.csv"
            )
        },
    )


@router.get("/{video_id}/keymoments/csv")
def export_keymoments_csv(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a CSV file containing the detected key moments for a video.

    Requires authentication and ownership of the video.
    """
    video = db.query(Video).filter(Video.id == video_id).first()

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video's report",
        )

    key_moments = (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video_id)
        .all()
    )

    csv_file = ReportService.generate_key_moments_csv(key_moments)

    return StreamingResponse(
        iter([csv_file.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f"attachment; filename=key_moments_{video_id}.csv"
            )
        },
    )


@router.get("/{video_id}/analytics/csv")
def export_analytics_csv(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Download a CSV file containing analytics data for a video.

    Requires authentication and ownership of the video.
    """
    video = db.query(Video).filter(Video.id == video_id).first()

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video's report",
        )

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id)
        .first()
    )

    analytics = AnalyticsService.get_analytics(db, video_id)

    csv_file = ReportService.generate_analytics_csv(
        video,
        transcript,
        summary,
        analytics,
    )

    return StreamingResponse(
        iter([csv_file.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                f"attachment; filename=analytics_{video_id}.csv"
            )
        },
    )
