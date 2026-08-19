from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_admin
from app.core.audit import record_audit_event
from app.core.platform_settings_store import get_platform_settings
from app.models.user import User
from app.models.role import Role
from app.models.video import Video, VideoStatus
from app.models.audit_log import AuditLog
from app.schemas.platform_settings import PlatformSettingsResponse, PlatformSettingsUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/settings", response_model=PlatformSettingsResponse)
def get_settings(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return get_platform_settings(db)


@router.put("/settings", response_model=PlatformSettingsResponse)
def update_settings(
    req: PlatformSettingsUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    settings = get_platform_settings(db)
    settings.maintenance_mode = req.maintenance_mode
    settings.allow_new_registrations = req.allow_new_registrations
    settings.max_upload_size_mb = req.max_upload_size_mb
    db.commit()
    db.refresh(settings)
    record_audit_event(
        db, current_user.id, "platform_settings_updated", target_type="platform_settings",
        detail=f"maintenance_mode={settings.maintenance_mode}, allow_new_registrations={settings.allow_new_registrations}, max_upload_size_mb={settings.max_upload_size_mb}",
    )
    return settings


@router.get("/system-stats")
def get_system_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Administrator overview: users by role, content by status, storage
    footprint, and in-flight AI processing jobs."""
    users_by_role_rows = (
        db.query(Role.name, func.count(User.id))
        .join(User, User.role_id == Role.id, isouter=True)
        .group_by(Role.name)
        .all()
    )
    users_by_role = {name: count for name, count in users_by_role_rows}

    videos_by_status_rows = db.query(Video.status, func.count(Video.id)).group_by(Video.status).all()
    videos_by_status = {str(s.value if hasattr(s, "value") else s): c for s, c in videos_by_status_rows}

    storage_bytes = db.query(func.sum(Video.file_size_bytes)).scalar() or 0
    processing_jobs = db.query(Video).filter(Video.status == VideoStatus.PROCESSING).count()

    return {
        "total_users": db.query(User).count(),
        "users_by_role": users_by_role,
        "total_videos": db.query(Video).count(),
        "videos_by_status": videos_by_status,
        "total_storage_used_mb": round(storage_bytes / (1024 * 1024), 2),
        "active_processing_jobs": processing_jobs,
    }


@router.get("/processing-jobs")
def get_processing_jobs(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Real per-video AI job status/history, not just a count — in-flight
    jobs first (UPLOADING/UPLOADED/PROCESSING), then the most recent
    completed/failed ones."""
    limit = min(limit, 200)

    in_flight_statuses = [VideoStatus.UPLOADING, VideoStatus.UPLOADED, VideoStatus.PROCESSING]
    in_flight = (
        db.query(Video)
        .filter(Video.status.in_(in_flight_statuses))
        .order_by(Video.created_at.desc())
        .all()
    )
    recent_done = (
        db.query(Video)
        .filter(Video.status.in_([VideoStatus.COMPLETED, VideoStatus.FAILED]))
        .order_by(Video.created_at.desc())
        .limit(limit)
        .all()
    )

    def _to_job(v: Video) -> dict:
        return {
            "video_id": v.id,
            "title": v.title,
            "status": v.status.value if hasattr(v.status, "value") else v.status,
            "duration_seconds": v.duration_seconds or 0,
            "file_size_bytes": v.file_size_bytes or 0,
            "created_at": v.created_at,
        }

    return {
        "in_flight": [_to_job(v) for v in in_flight],
        "recent": [_to_job(v) for v in recent_done],
    }


@router.get("/storage")
def get_storage_overview(
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Videos sorted by storage footprint, largest first — the concrete
    'what's using space' view behind the storage-used stat."""
    limit = min(limit, 200)
    videos = (
        db.query(Video)
        .order_by(Video.file_size_bytes.desc().nullslast())
        .limit(limit)
        .all()
    )
    total_bytes = db.query(func.sum(Video.file_size_bytes)).scalar() or 0

    return {
        "total_storage_used_mb": round(total_bytes / (1024 * 1024), 2),
        "videos": [
            {
                "video_id": v.id,
                "title": v.title,
                "file_size_mb": round((v.file_size_bytes or 0) / (1024 * 1024), 2),
                "status": v.status.value if hasattr(v.status, "value") else v.status,
                "created_at": v.created_at,
            }
            for v in videos
        ],
    }


@router.get("/audit-log")
def get_audit_log(
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    limit = min(limit, 500)
    entries = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": e.id,
            "actor_username": e.actor.username if e.actor else "System",
            "action": e.action,
            "target_type": e.target_type,
            "target_id": e.target_id,
            "detail": e.detail,
            "created_at": e.created_at,
        }
        for e in entries
    ]
