"""
Processing job tracker: records AI processing activity so administrators can
monitor transcription and summarization jobs on the Admin Dashboard.

Each job is persisted in the ``processing_jobs`` table and follows the
lifecycle:

    created (processing) -> completed
      \-> failed

Helpers accept an already-open SQLAlchemy session so they can be used both from
the request lifecycle and from FastAPI ``BackgroundTasks``.
"""
from datetime import datetime
from typing import Optional
import logging
from sqlalchemy.orm import Session

from app.models.processing_job import ProcessingJob

logger = logging.getLogger(__name__)

# Job types tracked on the Admin Dashboard.
JOB_TYPE_TRANSCRIPT = "transcript"
JOB_TYPE_SUMMARY = "summary"

# Maximum length for the stored result / error snippets (keep the row small).
_RESULT_MAX = 2000


def start_job(
    db: Session,
    video_id: int,
    job_type: str,
    progress: int = 5,
) -> ProcessingJob:
    """Create a processing job row and mark it as running."""
    job = ProcessingJob(
        video_id=video_id,
        job_type=job_type,
        status="processing",
        progress=progress,
        started_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def update_job_progress(db: Session, job_id: int, progress: int) -> None:
    """Update the progress percentage of a running job."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if job is None:
        return
    job.status = "processing"
    job.progress = max(0, min(100, progress))
    db.commit()


def complete_job(
    db: Session,
    job_id: int,
    result: Optional[str] = None,
) -> None:
    """Mark a job as completed with 100% progress."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if job is None:
        return
    job.status = "completed"
    job.progress = 100
    if result:
        job.result = result[:_RESULT_MAX]
    job.completed_at = datetime.utcnow()
    db.commit()


def fail_job(db: Session, job_id: int, error: str) -> None:
    """Mark a job as failed with an error message."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if job is None:
        return
    job.status = "failed"
    job.error_message = (error or "Unknown error")[:_RESULT_MAX]
    job.completed_at = datetime.utcnow()
    db.commit()


def backfill_existing_jobs(db: Session) -> int:
    """Create completed job records for existing transcripts / summaries.

    Videos that were transcribed or summarized before the Admin Dashboard job
    tracking existed have no ``processing_jobs`` rows, so they would never show
    up on the *AI Jobs* tab. This builds a completed ``transcript`` / ``summary``
    job for each existing artifact that does not yet have a matching job.

    Idempotent: a video with an existing job for a given type is left untouched.

    Returns the number of job records created.
    """
    from app.models.video import Video
    from app.models.transcript import Transcript
    from app.models.summary import Summary

    existing = {
        (job.video_id, job.job_type)
        for job in db.query(ProcessingJob.video_id, ProcessingJob.job_type).all()
    }
    created = 0
    added = []

    # Transcript jobs for existing transcripts without a tracked job.
    for transcript, video in db.query(Transcript, Video).join(Video, Video.id == Transcript.video_id).all():
        if (transcript.video_id, JOB_TYPE_TRANSCRIPT) in existing:
            continue
        result = (transcript.transcript or "").strip()[:_RESULT_MAX]
        added.append(
            ProcessingJob(
                video_id=transcript.video_id,
                job_type=JOB_TYPE_TRANSCRIPT,
                status="completed",
                progress=100,
                result=result or None,
                created_at=transcript.created_at,
                started_at=transcript.created_at,
                completed_at=transcript.created_at,
            )
        )
        existing.add((transcript.video_id, JOB_TYPE_TRANSCRIPT))

    # Summary jobs for existing summaries without a tracked job.
    for summary, video in db.query(Summary, Video).join(Video, Video.id == Summary.video_id).all():
        if (summary.video_id, JOB_TYPE_SUMMARY) in existing:
            continue
        result = (summary.short_summary or summary.detailed_summary or "")[: _RESULT_MAX]
        added.append(
            ProcessingJob(
                video_id=summary.video_id,
                job_type=JOB_TYPE_SUMMARY,
                status="completed",
                progress=100,
                result=result or None,
                created_at=summary.created_at,
                started_at=summary.created_at,
                completed_at=summary.created_at,
            )
        )
        existing.add((summary.video_id, JOB_TYPE_SUMMARY))

    if added:
        db.add_all(added)
        db.commit()
        created = len(added)
        logger.debug(f"Backfilled {created} processing jobs from existing records")

    return created


def deduplicate_jobs(db: Session) -> int:
    """Remove repeated processing jobs, keeping only the latest per video+type.

    Every transcript / summary generation creates a new ``processing_jobs`` row,
    so a video that was regenerated several times accumulates previews. To keep
    the *AI Jobs* tab clean and accurate this keeps, for each ``(video_id,
    job_type)`` group, the most recent job (highest id) and deletes the older
    duplicate rows.

    Returns the number of job records removed.
    """
    from sqlalchemy import func

    keep_ids = {
        max_id
        for _, _, max_id in db.query(
            ProcessingJob.video_id,
            ProcessingJob.job_type,
            func.max(ProcessingJob.id).label("max_id"),
        ).group_by(ProcessingJob.video_id, ProcessingJob.job_type).all()
    }

    if not keep_ids:
        return 0

    duplicates = (
        db.query(ProcessingJob)
        .filter(~ProcessingJob.id.in_(keep_ids))
        .all()
    )
    removed = len(duplicates)
    if removed:
        for job in duplicates:
            db.delete(job)
        db.commit()
        logger.debug(f"Removed {removed} duplicate processing jobs")

    return removed