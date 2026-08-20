"""
Admin operations router: platform monitoring and management endpoints for
Administrator accounts only.

Provides:
    - Monitor platform activity (activity logs)
    - Manage uploaded content (list / delete any video)
    - Monitor AI processing jobs
    - Manage storage and resource utilization
    - View system analytics
    - Configure platform settings
    - Access audit logs and reports (CSV exports)

Every endpoint is guarded by ``get_admin_user`` so only the Administrator
role can access them.
"""
import csv
import io
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.auth.dependencies import get_admin_user
from app.models.user import User
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.key_moment import KeyMoment
from app.models.processing_job import ProcessingJob
from app.models.activity_log import ActivityLog
from app.models.platform_setting import PlatformSetting
from app.models.analytics import Analytics
from app.services.video_service import VideoService
from app.services.analytics_service import AnalyticsService
from app.services.activity_service import log_activity
from app.services.processing_job_service import backfill_existing_jobs, deduplicate_jobs


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Operations"],
)


# ---------------------------------------------------------------------------
# Serializers
# ---------------------------------------------------------------------------
def _activity_to_dict(entry: ActivityLog, user: Optional[User]) -> dict:
    return {
        "id": entry.id,
        "user_id": entry.user_id,
        "user_email": user.email if user else None,
        "user_name": user.full_name if user else None,
        "action": entry.action,
        "resource_type": entry.resource_type,
        "resource_id": entry.resource_id,
        "description": entry.description,
        "ip_address": entry.ip_address,
        "user_agent": entry.user_agent,
        "created_at": entry.created_at,
    }


def _video_to_dict(video: Video, owner: Optional[User]) -> dict:
    return {
        "id": video.id,
        "title": video.title,
        "filename": video.filename,
        "file_size": video.file_size,
        "duration": video.duration,
        "status": video.status,
        "is_published": video.is_published,
        "video_url": video.video_url,
        "thumbnail_url": video.thumbnail_url,
        "created_at": video.created_at,
        "user_id": video.user_id,
        "owner_email": owner.email if owner else None,
        "owner_name": owner.full_name if owner else None,
    }


# ---------------------------------------------------------------------------
# Platform activity
# ---------------------------------------------------------------------------
@router.get("/activity")
def list_activity(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List recent platform activity (login, uploads, admin actions).
    Requires Administrator role.
    """
    query = db.query(ActivityLog, User).join(User, User.id == ActivityLog.user_id)
    if action:
        query = query.filter(ActivityLog.action == action)
    if user_id is not None:
        query = query.filter(ActivityLog.user_id == user_id)
    rows = (
        query.order_by(ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": query.count(),
        "items": [_activity_to_dict(entry, user) for entry, user in rows],
    }


@router.get("/activity/stats")
def activity_stats(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Aggregate counts of platform activity for the dashboard."""
    total = db.query(func.count(ActivityLog.id)).scalar() or 0
    logins = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == "login")
        .scalar()
        or 0
    )
    uploads = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action == "video.upload")
        .scalar()
        or 0
    )
    admin_actions = (
        db.query(func.count(ActivityLog.id))
        .filter(ActivityLog.action.like("admin.%"))
        .scalar()
        or 0
    )
    active_today = (
        db.query(func.count(ActivityLog.id))
        .filter(func.date(ActivityLog.created_at) == func.current_date())
        .scalar()
        or 0
    )
    top_actions = (
        db.query(ActivityLog.action, func.count(ActivityLog.id))
        .group_by(ActivityLog.action)
        .order_by(func.count(ActivityLog.id).desc())
        .limit(8)
        .all()
    )
    return {
        "total_events": total,
        "logins": logins,
        "video_uploads": uploads,
        "admin_actions": admin_actions,
        "active_today": active_today,
        "top_actions": [{"action": a, "count": c} for a, c in top_actions],
    }


@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Access the audit trail: administrative actions and security-related events.
    Requires Administrator role.
    """
    query = db.query(ActivityLog, User).join(User, User.id == ActivityLog.user_id)
    query = query.filter(
        (ActivityLog.action.like("admin.%"))
        | (ActivityLog.action.in_(["login", "register", "video.delete"]))
    )
    if action:
        query = query.filter(ActivityLog.action == action)
    rows = (
        query.order_by(ActivityLog.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return {
        "total": query.count(),
        "items": [_activity_to_dict(entry, user) for entry, user in rows],
    }



# ---------------------------------------------------------------------------
# Uploaded content management
# ---------------------------------------------------------------------------
def _content_counts(db: Session, video_id: int) -> dict:
    return {
        "transcripts": (
            db.query(func.count(Transcript.id))
            .filter(Transcript.video_id == video_id)
            .scalar()
            or 0
        ),
        "summaries": (
            db.query(func.count(Summary.id))
            .filter(Summary.video_id == video_id)
            .scalar()
            or 0
        ),
        "key_moments": (
            db.query(func.count(KeyMoment.id))
            .filter(KeyMoment.video_id == video_id)
            .scalar()
            or 0
        ),
    }


@router.get("/content")
def list_all_content(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all uploaded videos across the platform for moderation.
    Requires Administrator role.
    """
    query = db.query(Video, User).join(User, User.id == Video.user_id)
    if search:
        query = query.filter(
            Video.title.ilike(f"%{search}%") | (User.email.ilike(f"%{search}%"))
        )
    rows = (
        query.order_by(Video.created_at.desc()).offset(offset).limit(limit).all()
    )
    items = []
    for video, owner in rows:
        d = _video_to_dict(video, owner)
        d["counts"] = _content_counts(db, video.id)
        items.append(d)
    return {"total": query.count(), "items": items}


@router.delete("/content/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_any_video(
    video_id: int,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Delete any uploaded video (admin moderation).
    Requires Administrator role.
    """
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
        )
    owner = db.query(User).filter(User.id == video.user_id).first()
    title = video.title
    owner_email = owner.email if owner else None
    VideoService.delete_video(db, video)
    log_activity(
        db,
        user_id=current_user.id,
        action="admin.content.delete",
        resource_type="video",
        resource_id=video_id,
        description=f"Administrator deleted video '{title}'"
        + (f" owned by {owner_email}" if owner_email else ""),
    )
    return None



# ---------------------------------------------------------------------------
# AI processing jobs
# ---------------------------------------------------------------------------
@router.get("/jobs")
def list_processing_jobs(
    status_filter: Optional[str] = Query(None, alias="status"),
    job_type: Optional[str] = Query(None, alias="job_type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Monitor AI processing jobs (transcription, summarization, key moments).
    Requires Administrator role.
    """
    # Surface existing transcript / summary artifacts that were generated before
    # job tracking existed, so historical AI activity shows on the dashboard.
    backfill_existing_jobs(db)
    # Collapse repeated generations down to the latest job per video + type.
    deduplicate_jobs(db)

    query = (
        db.query(ProcessingJob, Video, User)
        .join(Video, Video.id == ProcessingJob.video_id)
        .join(User, User.id == Video.user_id)
    )
    if status_filter:
        query = query.filter(ProcessingJob.status == status_filter)
    if job_type:
        query = query.filter(ProcessingJob.job_type == job_type)
    rows = (
        query.order_by(ProcessingJob.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    items = []
    for job, video, user in rows:
        items.append({
            "id": job.id,
            "video_id": job.video_id,
            "video_title": video.title,
            "job_type": job.job_type,
            "status": job.status,
            "progress": job.progress,
            "error_message": job.error_message,
            "created_at": job.created_at,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "user_email": user.email if user else None,
        })
    return {"total": query.count(), "items": items}


@router.get("/jobs/stats")
def processing_job_stats(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Aggregate counts of AI processing jobs by status."""
    # Keep the status counts in sync with any backfilled historical records.
    backfill_existing_jobs(db)
    # Keep the counts accurate by collapsing repeated generations.
    deduplicate_jobs(db)

    rows = (
        db.query(ProcessingJob.status, func.count(ProcessingJob.id))
        .group_by(ProcessingJob.status)
        .all()
    )
    stats = {s: 0 for s in
             ("pending", "processing", "running", "completed", "failed", "error")}
    for s, c in rows:
        if s in stats:
            stats[s] = c
        else:
            stats[s] = c
    total = db.query(func.count(ProcessingJob.id)).scalar() or 0
    failed = (
        db.query(func.count(ProcessingJob.id))
        .filter(ProcessingJob.status.in_(["failed", "error"]))
        .scalar()
        or 0
    )
    return {"total": total, "failed": failed, "by_status": stats}


# ---------------------------------------------------------------------------
# Storage & resource utilization
# ---------------------------------------------------------------------------
@router.get("/storage")
def storage_utilization(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Storage and resource utilization report.
    Requires Administrator role.
    """
    total_storage = (
        db.query(func.coalesce(func.sum(Video.file_size), 0)).scalar() or 0
    )
    total_videos = db.query(func.count(Video.id)).scalar() or 0
    total_transcripts = db.query(func.count(Transcript.id)).scalar() or 0
    total_summaries = db.query(func.count(Summary.id)).scalar() or 0
    total_key_moments = db.query(func.count(KeyMoment.id)).scalar() or 0
    total_analytics = db.query(func.count(Analytics.id)).scalar() or 0

    per_user = (
        db.query(
            Video.user_id,
            User.email,
            User.full_name,
            func.count(Video.id),
            func.coalesce(func.sum(Video.file_size), 0),
        )
        .join(User, User.id == Video.user_id)
        .group_by(Video.user_id, User.email, User.full_name)
        .order_by(func.sum(Video.file_size).desc())
        .limit(50)
        .all()
    )
    per_user_items = [
        {
            "user_id": uid,
            "email": email,
            "name": full_name,
            "videos": vcount,
            "storage_bytes": sb,
        }
        for uid, email, full_name, vcount, sb in per_user
    ]

    return {
        "total_storage_bytes": total_storage,
        "total_videos": total_videos,
        "total_transcripts": total_transcripts,
        "total_summaries": total_summaries,
        "total_key_moments": total_key_moments,
        "total_analytics_records": total_analytics,
        "per_user": per_user_items,
    }


# ---------------------------------------------------------------------------
# System analytics
# ---------------------------------------------------------------------------
@router.get("/analytics")
def system_analytics(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Platform-wide system analytics (views, watch time, engagement).
    Requires Administrator role.
    """
    summary = AnalyticsService.get_all_analytics_summary(db)
    summary["total_transcripts"] = db.query(func.count(Transcript.id)).scalar() or 0
    summary["total_summaries"] = db.query(func.count(Summary.id)).scalar() or 0
    summary["total_key_moments"] = db.query(func.count(KeyMoment.id)).scalar() or 0
    summary["total_storage_bytes"] = (
        db.query(func.coalesce(func.sum(Video.file_size), 0)).scalar() or 0
    )
    return summary

# ---------------------------------------------------------------------------
# Platform settings
# ---------------------------------------------------------------------------
DEFAULT_PLATFORM_SETTINGS: Dict[str, dict] = {
    "site_name": {
        "value": "ClipMind AI",
        "value_type": "string",
        "description": "Display name of the platform.",
    },
    "allow_registration": {
        "value": "true",
        "value_type": "boolean",
        "description": "Whether new users may register on their own.",
    },
    "default_role": {
        "value": "Learner",
        "value_type": "string",
        "description": "Default role assigned to new registrations.",
    },
    "max_upload_mb": {
        "value": "100",
        "value_type": "number",
        "description": "Maximum allowed upload size in megabytes.",
    },
    "auto_process_on_upload": {
        "value": "true",
        "value_type": "boolean",
        "description": "Automatically run AI processing after upload.",
    },
    "maintenance_mode": {
        "value": "false",
        "value_type": "boolean",
        "description": "Restrict the platform to administrators for maintenance.",
    },
}


def _ensure_default_settings(db: Session) -> None:
    for key, meta in DEFAULT_PLATFORM_SETTINGS.items():
        exists = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if exists is None:
            db.add(PlatformSetting(
                key=key,
                value=meta["value"],
                value_type=meta["value_type"],
                description=meta["description"],
            ))
    db.commit()


@router.get("/settings")
def get_platform_settings(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Read all configurable platform settings.
    Requires Administrator role.
    """
    _ensure_default_settings(db)
    rows = db.query(PlatformSetting).order_by(PlatformSetting.key).all()
    return {
        "items": [
            {
                "key": s.key,
                "value": s.value,
                "value_type": s.value_type,
                "description": s.description,
                "updated_at": s.updated_at,
            }
            for s in rows
        ]
    }


class SettingsUpdate(BaseModel):
    """Payload for updating platform settings in bulk."""
    settings: Dict[str, str] = Field(
        ..., description="Map of setting key -> new value"
    )


@router.put("/settings")
def update_platform_settings(
    payload: SettingsUpdate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Update one or more platform settings.
    Requires Administrator role.
    """
    _ensure_default_settings(db)
    updated = []
    for key, value in payload.settings.items():
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        if setting is None:
            setting = PlatformSetting(
                key=key,
                value=str(value),
                value_type="string",
                description=None,
            )
            db.add(setting)
        else:
            setting.value = str(value)
        updated.append(key)
    db.commit()
    log_activity(
        db,
        user_id=current_user.id,
        action="admin.settings.update",
        resource_type="platform_settings",
        description=(
            f"Administrator updated platform settings: {', '.join(updated)}"
        ),
    )
    return {"updated": updated, "message": "Platform settings updated"}
# ---------------------------------------------------------------------------
# Audit / report CSV exports
# ---------------------------------------------------------------------------
def _csv_response(buffer: io.StringIO, filename: str) -> StreamingResponse:
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/reports/users")
def export_users_csv(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Export all users as a CSV report. Requires Administrator role."""
    rows = db.query(User).order_by(User.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "username", "full_name", "role",
                     "is_active", "is_verified", "created_at"])
    for u in rows:
        writer.writerow([u.id, u.email, u.username, u.full_name, u.role,
                         u.is_active, u.is_verified, u.created_at])
    return _csv_response(output, "users_report.csv")


@router.post("/reports/content")
def export_content_csv(
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Export all uploaded content as a CSV report. Requires Administrator role."""
    rows = db.query(Video, User).join(User, User.id == Video.user_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "filename", "file_size", "duration",
                     "status", "is_published", "owner_email", "created_at"])
    for v, owner in rows:
        writer.writerow([v.id, v.title, v.filename, v.file_size, v.duration,
                         v.status, v.is_published,
                         owner.email if owner else None, v.created_at])
    return _csv_response(output, "content_report.csv")


@router.post("/reports/activity")
def export_activity_csv(
    limit: int = Query(1000, ge=1, le=10000),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Export platform activity as a CSV report. Requires Administrator role."""
    rows = (
        db.query(ActivityLog, User)
        .join(User, User.id == ActivityLog.user_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(limit)
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "user_email", "action",
                     "resource_type", "resource_id", "description", "ip_address"])
    for entry, user in rows:
        writer.writerow([entry.id, entry.created_at,
                         user.email if user else None, entry.action,
                         entry.resource_type, entry.resource_id,
                         entry.description, entry.ip_address])
    return _csv_response(output, "activity_report.csv")
