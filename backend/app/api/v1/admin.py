"""
Admin-only endpoints: platform-wide stats (storage, resource utilization),
with room to grow into content moderation and platform-wide analytics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.core.mongo import key_moments_collection, summaries_collection, transcripts_collection
from app.models.user import User, UserRole
from app.models.video import Video, VideoStatus
from app.schemas.admin import PlatformStats

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