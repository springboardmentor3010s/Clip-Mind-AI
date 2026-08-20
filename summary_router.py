"""
Summary router: endpoints for video summary management.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.summary import Summary
from app.models.transcript import Transcript
from app.models.video import Video
from app.schemas.summary import (
    SummaryRead,
    SummaryUpdate,
    SummaryStatusResponse,
    SummaryEvaluationResponse,
)
from app.schemas.summary_validation import SummaryValidationResponse
from app.services.evaluation_service import EvaluationService
from app.services.summary_service import SummaryService, generate_bullet_points
from app.services.summary_validation_service import SummaryValidationService
from app.services.video_service import VideoService
from app.services.processing_job_service import (
    JOB_TYPE_SUMMARY,
    complete_job,
    fail_job,
    start_job,
    update_job_progress,
)

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/videos/{video_id}/summary",
    tags=["Summaries"],
)


def _get_video_for_read(
    db: Session,
    video_id: int,
    current_user,
) -> Video:
    """Fetch video and allow access if published OR owned by the user."""

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

    return video


def _get_video_or_404(
    db: Session,
    video_id: int,
    current_user,
) -> Video:
    """Fetch video and verify ownership."""

    video = VideoService.get_video_by_id(db, video_id)

    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )

    return video


# ---------------------------------------------------------
# Get Summary
# ---------------------------------------------------------

@router.get("/", response_model=SummaryRead | SummaryStatusResponse)
def get_summary(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    video = _get_video_for_read(db, video_id, current_user)

    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id)
        .first()
    )

    if video.summary is None:
        # Return 202 with status information if summary is being generated or failed
        if video.status == "failed":
            return JSONResponse(
                status_code=202,
                content={
                    "status": "failed",
                    "message": "Summary generation failed. Click generate to retry.",
                },
            )
        if video.status in ["processing_summary", "processing"]:
            return JSONResponse(
                status_code=202,
                content={
                    "status": video.status,
                    "message": "Summary is being generated. Please check back in a moment.",
                },
            )
        raise HTTPException(
            status_code=404,
            detail="Summary not found. Generate a summary first.",
        )

    return video.summary


# ---------------------------------------------------------
# Get Summary Evaluation
# ---------------------------------------------------------

@router.get(
    "/evaluation",
    response_model=SummaryEvaluationResponse,
)
def get_summary_evaluation(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    video = _get_video_for_read(
        db,
        video_id,
        current_user,
    )

    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id)
        .first()
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found.",
        )

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    if transcript is None:
        raise HTTPException(
            status_code=404,
            detail="Transcript not found.",
        )

    evaluator = EvaluationService()

    metrics = evaluator.evaluate(
        transcript.transcript,
        summary.detailed_summary,
    )

    return metrics

# ---------------------------------------------------------
# Validate Summary Quality
# ---------------------------------------------------------

@router.get("/validate", response_model=SummaryValidationResponse)
def validate_summary(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Validate the accuracy & quality of a video's summary.

    Computes a quantitative quality report (word counts, reading time,
    compression ratio, ROUGE/content coverage, keyword coverage, bullet-point
    count) with a 0-100 quality score, a rating and boolean flags so educators
    can quickly review AI-generated summaries.

    Accessible whenever the video is readable (published OR owned by the user).
    The transcript is optional - when absent the coverage metrics degrade to
    neutral values instead of failing.
    """
    video = _get_video_for_read(db, video_id, current_user)

    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id)
        .first()
    )

    if summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found. Generate a summary first.",
        )

    transcript_text = None
    if video.transcript is not None and video.transcript.transcript:
        transcript_text = video.transcript.transcript

    report = SummaryValidationService.validate(
        summary,
        transcript_text=transcript_text,
        video_duration=video.duration,
    )

    return report

# ---------------------------------------------------------
# Generate Summary (background)
# ---------------------------------------------------------

def _generate_summary_background(video_id: int, job_id: int = None):
    from app.database.database import SessionLocal

    db = SessionLocal()

    try:
        logger.info("=" * 50)
        logger.info(f"Starting summary generation for video {video_id}")

        video = db.query(Video).filter(Video.id == video_id).first()

        if not video:
            logger.error("Video not found")
            fail_job(db, job_id, "Video not found")
            return

        logger.info(f"Video found: {video.title}")

        # Move the tracked job forward so admins see live progress.
        update_job_progress(db, job_id, 35)

        if video.transcript is None:
            logger.error("Transcript object is None")
            fail_job(db, job_id, "Transcript not found")
            return

        transcript = video.transcript.transcript

        if not transcript or not transcript.strip():
            logger.error("Transcript is empty")
            fail_job(db, job_id, "Transcript is empty")
            return

        logger.info(f"Transcript length: {len(transcript)}")

        service = SummaryService()

        logger.info("Generating summaries...")

        update_job_progress(db, job_id, 55)

        summaries = service.generate_all_summaries(transcript)

        logger.info("Summary generation successful")
        update_job_progress(db, job_id, 85)

        # Build key bullet points from the generated content.
        bullet_source = (
            summaries["detailed_summary"] or summaries["short_summary"]
        )
        bullet_points = generate_bullet_points(bullet_source)

        summary = db.query(Summary).filter(
            Summary.video_id == video.id
        ).first()

        if summary:

            logger.info("Updating existing summary")

            summary.short_summary = summaries["short_summary"]
            summary.detailed_summary = summaries["detailed_summary"]
            summary.model_used = summaries["model_used"]
            summary.bullet_points = bullet_points or summary.bullet_points

        else:

            logger.info("Creating new summary")

            summary = Summary(
                video_id=video.id,
                short_summary=summaries["short_summary"],
                detailed_summary=summaries["detailed_summary"],
                model_used=summaries["model_used"],
                bullet_points=bullet_points,
            )

            db.add(summary)

        video.status = "completed"

        db.commit()

        # Record successful AI processing activity on the Admin Dashboard.
        complete_job(db, job_id, result=summaries.get("short_summary"))

        logger.info("Database commit successful")

    except Exception as e:

        db.rollback()
        fail_job(db, job_id, str(e))

        logger.exception(e)

    finally:

        db.close()
@router.post("/generate", response_model=SummaryRead | SummaryStatusResponse)
def generate_summary(
    video_id: int,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    video = _get_video_or_404(db, video_id, current_user)

    if video.transcript is None:
        raise HTTPException(
            status_code=400,
            detail="Transcript not found. Generate transcript first.",
        )

    transcript = video.transcript.transcript

    if not transcript or not transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="Transcript is empty.",
        )

    # Set status to processing
    video.status = "processing_summary"
    db.commit()

    # Track the AI processing activity on the Admin Dashboard.
    job = start_job(db, video.id, JOB_TYPE_SUMMARY, progress=10)

    # Add summary generation to background tasks (no db session passed)
    background_tasks.add_task(_generate_summary_background, video_id, job.id)

    # Return 202 Accepted with status info
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "status": "processing_summary",
            "message": "Summary generation started. Please check back in a moment.",
        },
    )


# ---------------------------------------------------------
# Update Summary
# ---------------------------------------------------------

@router.put("/", response_model=SummaryRead)
def update_summary(
    video_id: int,
    payload: SummaryUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    video = _get_video_or_404(db, video_id, current_user)

    if video.summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found.",
        )

    summary = video.summary

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(summary, field, value)

    db.commit()

    db.refresh(summary)

    return summary


# ---------------------------------------------------------
# Generate Bullet Points (on-demand, for existing summaries)
# ---------------------------------------------------------

@router.post("/bullet-points", response_model=SummaryRead)
def generate_bullet_points_endpoint(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Extract key bullet points from an existing summary and store them.

    Runs synchronously — the extractor is pure Python (sentence scoring)
    so it completes in milliseconds without extra model inference.
    """
    video = _get_video_or_404(db, video_id, current_user)

    if video.summary is None:
        raise HTTPException(
            status_code=404,
            detail="Summary not found. Generate a summary first.",
        )

    summary = video.summary

    source_text = summary.detailed_summary or summary.short_summary

    summary.bullet_points = generate_bullet_points(source_text)

    db.commit()

    db.refresh(summary)

    return summary