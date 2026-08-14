"""
Admin-only endpoints: platform-wide stats (storage, resource utilization),
content moderation, and audit logs.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.mongo import key_moments_collection, summaries_collection, transcripts_collection, video_views_collection
from app.models.user import User, UserRole
from app.models.video import Video, VideoStatus
from app.schemas.admin import PlatformStats, AuditLogOut
from app.schemas.video import VideoOut
from app.services.video_service import delete_video_files_and_row, get_video_or_404_any, list_all_videos
from app.services.audit_service import log_action
from app.models.audit_log import AuditLog

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role(UserRole.ADMINISTRATOR))],
)


@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(db: Session = Depends(get_db)):
    """Platform-wide user, video, storage, and content stats for the admin dashboard."""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active.is_(True)).count()

    users_by_role = {
        role.value: db.query(User).filter(User.role == role).count() for role in UserRole
    }

    total_videos = db.query(Video).count()
    published_videos = db.query(Video).filter(Video.is_published.is_(True)).count()
    videos_by_status = {
        s.value: db.query(Video).filter(Video.status == s).count() for s in VideoStatus
    }

    total_storage_mb = db.query(func.coalesce(func.sum(Video.file_size_mb), 0.0)).scalar()
    avg_video_size_mb = (total_storage_mb / total_videos) if total_videos else 0.0

    total_transcripts = await transcripts_collection.count_documents({})
    total_summaries = await summaries_collection.count_documents({})
    total_key_moments = await key_moments_collection.count_documents({})

    return PlatformStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=total_users - active_users,
        users_by_role=users_by_role,
        total_videos=total_videos,
        published_videos=published_videos,
        videos_by_status=videos_by_status,
        total_storage_mb=round(total_storage_mb, 1),
        avg_video_size_mb=round(avg_video_size_mb, 1),
        total_transcripts=total_transcripts,
        total_summaries=total_summaries,
        total_key_moments=total_key_moments,
    )


@router.get("/videos", response_model=list[VideoOut])
def get_all_videos(db: Session = Depends(get_db)):
    """Content moderation: every video on the platform, from every user."""
    return list_all_videos(db)


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_any_video(
    video_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Content moderation: admin-initiated removal of any video regardless of
    owner. Mirrors the owner's own delete (files + Postgres row + Mongo
    transcript/summary/key-moments/views), just without the ownership check.
    """
    video = get_video_or_404_any(db, video_id)
    video_label = video.title or video.filename

    await transcripts_collection.delete_one({"video_id": str(video_id)})
    await summaries_collection.delete_one({"video_id": str(video_id)})
    await key_moments_collection.delete_one({"video_id": str(video_id)})
    await video_views_collection.delete_many({"video_id": str(video_id)})

    delete_video_files_and_row(db, video)
    log_action(
        db,
        actor_id=current_user.id,
        action="video.deleted_by_admin",
        target_type="video",
        target_id=video_id,
        detail=video_label,
    )


@router.get("/audit-logs", response_model=list[AuditLogOut])
def get_audit_logs(db: Session = Depends(get_db)):
    """Admin-only: recent platform activity, newest first."""
    rows = (
        db.query(AuditLog, User.full_name)
        .join(User, User.id == AuditLog.actor_id)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        AuditLogOut(
            id=log.id,
            actor_id=log.actor_id,
            actor_name=actor_name,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            detail=log.detail,
            created_at=log.created_at,
        )
        for log, actor_name in rows
    ]