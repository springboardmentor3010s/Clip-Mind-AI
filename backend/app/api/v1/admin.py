"""
Admin-only routes — view all users, update roles, delete users,
and see platform-wide statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.models.user import User, UserRole
from app.models.video import Video
from app.models.analytics import AnalyticsEvent
from app.api.deps import require_role

router = APIRouter()


@router.get("/users")
def list_all_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        video_count = db.query(Video).filter(Video.user_id == u.user_id).count()
        result.append({
            "user_id": str(u.user_id),
            "username": u.username,
            "email": u.email,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "video_count": video_count,
        })
    return result


@router.get("/stats")
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    total_users = db.query(User).count()
    total_videos = db.query(Video).count()
    total_storage_mb = round(sum(v.file_size_mb for v in db.query(Video).all()), 2)

    role_counts = {}
    for role in UserRole:
        role_counts[role.value] = db.query(User).filter(User.role == role).count()

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "total_storage_mb": total_storage_mb,
        "role_counts": role_counts,
    }


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role.")

    user.role = payload.role
    db.commit()
    return {"message": f"Role updated to {payload.role}."}


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account.")

    user.is_active = not user.is_active
    db.commit()
    return {"message": "User status updated.", "is_active": user.is_active}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    import os
    from app.models.video import Video
    from app.models.analytics import AnalyticsEvent

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account.")

    # Delete this user's analytics history first (references users.user_id)
    db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user.user_id).delete()

    # Delete this user's videos next (and their files on disk)
    user_videos = db.query(Video).filter(Video.user_id == user.user_id).all()
    for v in user_videos:
        if v.file_path and os.path.exists(v.file_path):
            os.remove(v.file_path)
        if v.thumbnail_url and os.path.exists(v.thumbnail_url):
            os.remove(v.thumbnail_url)
        if v.audio_path and os.path.exists(v.audio_path):
            os.remove(v.audio_path)
        db.delete(v)

    db.delete(user)
    db.commit()
    return {"message": "User and their videos deleted."}

    # ── Platform Activity Monitoring ──────────────────────────────

@router.get("/activity")
def get_platform_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    events = (
        db.query(AnalyticsEvent)
        .order_by(AnalyticsEvent.event_timestamp.desc())
        .limit(limit)
        .all()
    )
    result = []
    for e in events:
        user = db.query(User).filter(User.user_id == e.user_id).first()
        result.append({
            "event_id": str(e.event_id),
            "username": user.username if user else "Unknown",
            "role": user.role.value if user else "unknown",
            "event_type": e.event_type,
            "video_title": e.video_title or "—",
            "timestamp": e.event_timestamp,
        })
    return result


# ── Content Management (any user's videos) ────────────────────

@router.get("/content")
def list_all_content(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    videos = db.query(Video).order_by(Video.uploaded_at.desc()).all()
    result = []
    for v in videos:
        owner = db.query(User).filter(User.user_id == v.user_id).first()
        result.append({
            "video_id": str(v.video_id),
            "title": v.title,
            "owner_username": owner.username if owner else "Unknown",
            "file_format": v.file_format,
            "file_size_mb": v.file_size_mb,
            "status": v.status.value,
            "uploaded_at": v.uploaded_at,
        })
    return result


@router.delete("/content/{video_id}")
def admin_delete_content(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    import os
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    title = video.title
    if video.file_path and os.path.exists(video.file_path):
        os.remove(video.file_path)
    if video.thumbnail_url and os.path.exists(video.thumbnail_url):
        os.remove(video.thumbnail_url)
    if video.audio_path and os.path.exists(video.audio_path):
        os.remove(video.audio_path)

    db.delete(video)
    db.commit()
    return {"message": f'Video "{title}" removed by admin.'}


# ── AI Processing Job Monitoring ───────────────────────────────

@router.get("/processing-jobs")
def get_processing_jobs(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    from app.models.video import VideoStatus

    processing = db.query(Video).filter(Video.status == VideoStatus.processing).all()
    failed = db.query(Video).filter(Video.status == VideoStatus.failed).all()

    def serialize(v):
        owner = db.query(User).filter(User.user_id == v.user_id).first()
        return {
            "video_id": str(v.video_id),
            "title": v.title,
            "owner_username": owner.username if owner else "Unknown",
            "status": v.status.value,
            "uploaded_at": v.uploaded_at,
        }

    return {
        "processing": [serialize(v) for v in processing],
        "failed": [serialize(v) for v in failed],
        "processing_count": len(processing),
        "failed_count": len(failed),
    }


# ── Storage & Resource Utilization ─────────────────────────────

@router.get("/storage")
def get_storage_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    videos = db.query(Video).all()
    total_storage_mb = round(sum(v.file_size_mb for v in videos), 2)

    by_format = {}
    for v in videos:
        fmt = v.file_format or "unknown"
        by_format[fmt] = round(by_format.get(fmt, 0) + v.file_size_mb, 2)

    by_user = {}
    for v in videos:
        owner = db.query(User).filter(User.user_id == v.user_id).first()
        uname = owner.username if owner else "Unknown"
        by_user[uname] = round(by_user.get(uname, 0) + v.file_size_mb, 2)

    top_users = sorted(by_user.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "total_storage_mb": total_storage_mb,
        "total_videos": len(videos),
        "storage_by_format": by_format,
        "top_users_by_storage": [{"username": u, "storage_mb": s} for u, s in top_users],
    }


# ── Platform Settings ───────────────────────────────────────────

from app.db.mongodb import mongo_db
settings_collection = mongo_db["platform_settings"]


class PlatformSettingsRequest(BaseModel):
    platform_name: str
    max_upload_size_mb: int
    maintenance_mode: bool


@router.get("/settings")
async def get_platform_settings(current_user: User = Depends(require_role("admin"))):
    doc = await settings_collection.find_one({"_key": "global"})
    if not doc:
        return {
            "platform_name": "ClipMind AI",
            "max_upload_size_mb": 500,
            "maintenance_mode": False,
        }
    return {
        "platform_name": doc.get("platform_name", "ClipMind AI"),
        "max_upload_size_mb": doc.get("max_upload_size_mb", 500),
        "maintenance_mode": doc.get("maintenance_mode", False),
    }


@router.put("/settings")
async def update_platform_settings(
    payload: PlatformSettingsRequest,
    current_user: User = Depends(require_role("admin")),
):
    await settings_collection.update_one(
        {"_key": "global"},
        {"$set": {
            "platform_name": payload.platform_name,
            "max_upload_size_mb": payload.max_upload_size_mb,
            "maintenance_mode": payload.maintenance_mode,
        }},
        upsert=True,
    )
    return {"message": "Settings updated."}


# ── Audit Logs (downloadable report) ────────────────────────────

@router.get("/audit-logs/download")
def download_audit_logs(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    from fastapi.responses import PlainTextResponse

    events = db.query(AnalyticsEvent).order_by(AnalyticsEvent.event_timestamp.desc()).all()

    lines = ["ClipMind AI — Platform Audit Log", "=" * 50, ""]
    for e in events:
        user = db.query(User).filter(User.user_id == e.user_id).first()
        uname = user.username if user else "Unknown"
        lines.append(f"[{e.event_timestamp}] {uname} — {e.event_type} — {e.video_title or '—'}")

    content = "\n".join(lines)
    return PlainTextResponse(
        content,
        headers={"Content-Disposition": 'attachment; filename="clipmind_audit_log.txt"'},
    )

@router.get("/trending")
async def get_admin_trending(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    from app.db.mongodb import transcripts_collection
    from app.services.keywords import extract_keywords

    cursor = transcripts_collection.find({})
    all_text = ""
    async for doc in cursor:
        all_text += " " + doc.get("text", "")
    top_keywords = extract_keywords(all_text, top_n=10) if all_text.strip() else []

    videos = db.query(Video).all()
    events = db.query(AnalyticsEvent).all()

    event_counts_by_video = {}
    event_counts_by_user = {}
    for e in events:
        if e.video_id:
            event_counts_by_video[e.video_id] = event_counts_by_video.get(e.video_id, 0) + 1
        event_counts_by_user[e.user_id] = event_counts_by_user.get(e.user_id, 0) + 1

    top_videos = []
    for v in videos:
        count = event_counts_by_video.get(v.video_id, 0)
        if count > 0:
            top_videos.append({"video_id": str(v.video_id), "title": v.title, "engagement": count})
    top_videos.sort(key=lambda x: x["engagement"], reverse=True)
    top_videos = top_videos[:8]

    top_user_ids = sorted(event_counts_by_user.items(), key=lambda x: x[1], reverse=True)[:5]
    top_users = []
    for uid, count in top_user_ids:
        u = db.query(User).filter(User.user_id == uid).first()
        if u:
            top_users.append({"username": u.username, "role": u.role.value, "events": count})

    return {"top_keywords": top_keywords, "top_videos": top_videos, "top_users": top_users}