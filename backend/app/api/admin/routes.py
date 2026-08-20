from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.postgres import get_db

from app.models.user import User
from app.models.video import Video
from app.models.course import Course
from app.models.audit_log import AuditLog
from app.services.audit_service import create_audit_log
from app.models.platform_setting import PlatformSetting
import os
from app.models.transcript import Transcript
router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =====================================================
# ADMIN DASHBOARD
# =====================================================

@router.get("/dashboard")
def admin_dashboard(
    db: Session = Depends(get_db)
):

    total_users = (
        db.query(User)
        .count()
    )

    total_educators = (
        db.query(User)
        .filter(
            User.role == "educator"
        )
        .count()
    )

    total_learners = (
        db.query(User)
        .filter(
            User.role == "learner"
        )
        .count()
    )

    total_creators = (
        db.query(User)
        .filter(
            User.role == "creator"
        )
        .count()
    )

    total_admins = (
        db.query(User)
        .filter(
            User.role == "admin"
        )
        .count()
    )

    total_videos = (
        db.query(Video)
        .count()
    )

    completed_videos = (
        db.query(Video)
        .filter(
            Video.status == "Completed"
        )
        .count()
    )

    processing_videos = (
        db.query(Video)
        .filter(
            Video.status == "Processing"
        )
        .count()
    )

    failed_videos = (
        db.query(Video)
        .filter(
            Video.status == "Failed"
        )
        .count()
    )

    total_courses = (
        db.query(Course)
        .count()
    )

    total_views = (
        db.query(
            func.coalesce(
                func.sum(Video.views),
                0
            )
        )
        .scalar()
    )

    return {

        "users": {

            "total":
                total_users,

            "educators":
                total_educators,

            "learners":
                total_learners,

            "creators":
                total_creators,

            "admins":
                total_admins

        },

        "content": {

            "videos":
                total_videos,

            "completed":
                completed_videos,

            "processing":
                processing_videos,

            "failed":
                failed_videos,

            "courses":
                total_courses,

            "views":
                total_views

        }

    }
    
# =====================================================
# MANAGE USERS
# =====================================================

@router.get("/users")
def get_users(
    db: Session = Depends(get_db)
):

    users = (
        db.query(User)
        .order_by(
            User.created_at.desc()
        )
        .all()
    )

    return [

        {

            "id":
                user.id,

            "username":
                user.username,

            "full_name":
                user.full_name,

            "email":
                user.email,

            "role":
                user.role,

            "created_at":
                user.created_at

        }

        for user in users

    ]


# =====================================================
# CHANGE USER ROLE
# =====================================================

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db)
):

    allowed_roles = {

        "admin",
        "educator",
        "learner",
        "creator"

    }

    if role not in allowed_roles:

        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    old_role = user.role

    user.role = role

    db.commit()

    create_audit_log(

        db=db,

        action="ROLE_CHANGED",

        description=(
            f"Role changed from "
            f"{old_role} to {role}"
        ),

        user_id=user.id,

        username=user.username,

        entity_type="user",

        entity_id=user.id

    )

    db.refresh(user)

    return {

        "message":
            "User role updated",

        "user_id":
            user.id,

        "role":
            user.role

    }


# =====================================================
# DELETE USER
# =====================================================

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    create_audit_log(

        db=db,

        action="USER_DELETED",

        description=(
            f"User {user.username} "
            f"was deleted"
        ),

        user_id=user.id,

        username=user.username,

        entity_type="user",

        entity_id=user.id

    )

    db.delete(user)

    db.commit()

    return {

        "message":
            "User deleted successfully"

    }
    
# =====================================================
# MANAGE VIDEOS
# =====================================================

@router.get("/videos")
def get_all_videos(
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .order_by(
            Video.uploaded_at.desc()
        )
        .all()
    )

    return [

        {

            "id":
                video.id,

            "title":
                video.title,

            "category":
                video.category,

            "status":
                video.status,

            "views":
                video.views or 0,

            "file_size":
                video.file_size,

            "uploaded_at":
                video.uploaded_at,

            "user_id":
                video.user_id,

            "course_id":
                video.course_id

        }

        for video in videos

    ]
    
# =====================================================
# ADMIN SYSTEM ANALYTICS
# =====================================================

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db)
):

    # -----------------------------
    # BASIC PLATFORM STATISTICS
    # -----------------------------

    total_users = db.query(User).count()

    total_educators = (
        db.query(User)
        .filter(User.role == "educator")
        .count()
    )

    total_learners = (
        db.query(User)
        .filter(User.role == "learner")
        .count()
    )

    total_creators = (
        db.query(User)
        .filter(User.role == "creator")
        .count()
    )

    total_admins = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    total_courses = db.query(Course).count()

    total_videos = db.query(Video).count()

    total_views = (
        db.query(
            func.coalesce(
                func.sum(Video.views),
                0
            )
        )
        .scalar()
    )


    # -----------------------------
    # MOST VIEWED
    # -----------------------------

    most_viewed = (
        db.query(Video)
        .order_by(
            Video.views.desc()
        )
        .first()
    )


    # -----------------------------
    # LEAST VIEWED
    # -----------------------------

    least_viewed = (
        db.query(Video)
        .filter(
            Video.views.isnot(None)
        )
        .order_by(
            Video.views.asc()
        )
        .first()
    )


    # -----------------------------
    # PROCESSING
    # -----------------------------

    completed = (
        db.query(Video)
        .filter(
            Video.status == "Completed"
        )
        .count()
    )

    processing = (
        db.query(Video)
        .filter(
            Video.status == "Processing"
        )
        .count()
    )

    failed = (
        db.query(Video)
        .filter(
            Video.status == "Failed"
        )
        .count()
    )

    uploaded = (
        db.query(Video)
        .filter(
            Video.status == "Uploaded"
        )
        .count()
    )


    total_processed = (
        completed +
        failed
    )

    processing_success_rate = (

        round(
            (
                completed /
                total_processed
            ) * 100,
            2
        )

        if total_processed > 0

        else 0

    )


    return {

        "users": {

            "total":
                total_users,

            "educators":
                total_educators,

            "learners":
                total_learners,

            "creators":
                total_creators,

            "admins":
                total_admins

        },

        "content": {

            "courses":
                total_courses,

            "videos":
                total_videos,

            "views":
                total_views

        },

        "most_viewed": (

            {
                "id":
                    most_viewed.id,

                "title":
                    most_viewed.title,

                "views":
                    most_viewed.views or 0

            }

            if most_viewed

            else None

        ),

        "least_viewed": (

            {
                "id":
                    least_viewed.id,

                "title":
                    least_viewed.title,

                "views":
                    least_viewed.views or 0

            }

            if least_viewed

            else None

        ),

        "processing": {

            "completed":
                completed,

            "processing":
                processing,

            "failed":
                failed,

            "uploaded":
                uploaded,

            "success_rate":
                processing_success_rate

        }

    }
    
# =====================================================
# AI PROCESSING JOBS
# =====================================================

@router.get("/processing")
def get_processing_jobs(
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .filter(
            Video.status.in_([
                "Processing",
                "Completed",
                "Failed",
                "Uploaded"
            ])
        )
        .order_by(
            Video.uploaded_at.desc()
        )
        .all()
    )

    data = []

    for video in videos:

        data.append({

            "id":
                video.id,

            "title":
                video.title,

            "status":
                video.status,

            "processing_stage":
                video.processing_stage or "Waiting",

            "progress":
                video.progress or 0,

            "processing_started":
                video.processing_started,

            "processing_completed":
                video.processing_completed,

            "error_message":
                video.error_message,

            "uploaded_at":
                video.uploaded_at

        })

    return data

# =====================================================
# STORAGE & RESOURCE UTILIZATION
# =====================================================

@router.get("/storage")
def get_storage_stats(
    db: Session = Depends(get_db)
):

    total_videos = (
        db.query(Video)
        .count()
    )

    total_storage = (
        db.query(
            func.coalesce(
                func.sum(Video.file_size),
                0
            )
        )
        .scalar()
    )

    average_size = (
        db.query(
            func.coalesce(
                func.avg(Video.file_size),
                0
            )
        )
        .scalar()
    )

    largest_video = (
        db.query(Video)
        .order_by(
            Video.file_size.desc()
        )
        .first()
    )

    # -----------------------------------------
    # PROCESSING RESOURCE STATUS
    # -----------------------------------------

    processing = (
        db.query(Video)
        .filter(
            Video.status == "Processing"
        )
        .count()
    )

    completed = (
        db.query(Video)
        .filter(
            Video.status == "Completed"
        )
        .count()
    )

    failed = (
        db.query(Video)
        .filter(
            Video.status == "Failed"
        )
        .count()
    )

    # -----------------------------------------
    # STORAGE BY CATEGORY
    # -----------------------------------------

    category_storage = (
        db.query(
            Video.category,
            func.coalesce(
                func.sum(Video.file_size),
                0
            )
        )
        .group_by(
            Video.category
        )
        .all()
    )

    categories = []

    for category, size in category_storage:

        categories.append({

            "category":
                category or "Uncategorized",

            "storage":
                size or 0

        })

    return {

        "total_videos":
            total_videos,

        "total_storage":
            total_storage,

        "average_file_size":
            average_size,

        "largest_video": (

            {

                "id":
                    largest_video.id,

                "title":
                    largest_video.title,

                "file_size":
                    largest_video.file_size or 0

            }

            if largest_video

            else None

        ),

        "processing": {

            "processing":
                processing,

            "completed":
                completed,

            "failed":
                failed

        },

        "categories":
            categories

    }

# =====================================================
# AUDIT LOGS
# =====================================================

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db)
):

    logs = (
        db.query(AuditLog)
        .order_by(
            AuditLog.created_at.desc()
        )
        .limit(200)
        .all()
    )

    return [

        {

            "id":
                log.id,

            "user_id":
                log.user_id,

            "username":
                log.username,

            "action":
                log.action,

            "description":
                log.description,

            "entity_type":
                log.entity_type,

            "entity_id":
                log.entity_id,

            "created_at":
                log.created_at

        }

        for log in logs

    ]
    
# =====================================================
# PLATFORM SETTINGS
# =====================================================

DEFAULT_SETTINGS = {

    "platform_name": {
        "value": "ClipMind AI",
        "description": "Platform display name"
    },

    "max_upload_size_mb": {
        "value": "500",
        "description": "Maximum video upload size in MB"
    },

    "allowed_video_formats": {
        "value": "mp4,mkv,avi,mov,webm",
        "description": "Allowed video file formats"
    },

    "ai_processing_enabled": {
        "value": "true",
        "description": "Enable or disable AI video processing"
    }

}


@router.get("/settings")
def get_platform_settings(
    db: Session = Depends(get_db)
):

    settings = (
        db.query(PlatformSetting)
        .all()
    )

    existing = {
        setting.setting_key: setting
        for setting in settings
    }

    result = []

    for key, default in DEFAULT_SETTINGS.items():

        setting = existing.get(key)

        result.append({

            "key":
                key,

            "value":
                setting.setting_value
                if setting
                else default["value"],

            "description":
                setting.description
                if setting
                else default["description"]

        })

    return result


@router.put("/settings/{setting_key}")
def update_platform_setting(
    setting_key: str,
    setting_value: str,
    db: Session = Depends(get_db)
):

    if setting_key not in DEFAULT_SETTINGS:

        raise HTTPException(
            status_code=400,
            detail="Invalid platform setting"
        )

    setting = (
        db.query(PlatformSetting)
        .filter(
            PlatformSetting.setting_key
            == setting_key
        )
        .first()
    )

    if setting:

        setting.setting_value = setting_value

    else:

        setting = PlatformSetting(

            setting_key=setting_key,

            setting_value=setting_value,

            description=
                DEFAULT_SETTINGS[
                    setting_key
                ]["description"]

        )

        db.add(setting)

    db.commit()

    db.refresh(setting)

    return {

        "message":
            "Platform setting updated",

        "key":
            setting.setting_key,

        "value":
            setting.setting_value

    }
    
# =====================================================
# DELETE VIDEO / CONTENT
# =====================================================

@router.delete("/videos/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(
            Video.id == video_id
        )
        .first()
    )

    if not video:

        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    video_title = video.title
    video_filename = video.filename
    transcript_path = video.transcript_path
    video_user_id = video.user_id

    # -----------------------------------------
    # AUDIT LOG
    # -----------------------------------------

    create_audit_log(

        db=db,

        action="VIDEO_DELETED",

        description=(
            f"Lecture '{video_title}' "
            f"was deleted by administrator"
        ),

        user_id=video_user_id,

        entity_type="video",

        entity_id=video.id

    )

    # -----------------------------------------
    # DELETE TRANSCRIPT DATABASE RECORD
    # -----------------------------------------

    db.query(Transcript).filter(
        Transcript.video_id == video.id
    ).delete(
        synchronize_session=False
    )

    # -----------------------------------------
    # DELETE VIDEO FILE
    # -----------------------------------------

    if video_filename:

        video_file = os.path.join(
            "uploads",
            "videos",
            video_filename
        )

        if os.path.exists(video_file):

            try:

                os.remove(video_file)

            except Exception as e:

                print(
                    f"Could not delete video file: {e}"
                )

    # -----------------------------------------
    # DELETE TRANSCRIPT FILE
    # -----------------------------------------

    if transcript_path:

        if os.path.exists(transcript_path):

            try:

                os.remove(transcript_path)

            except Exception as e:

                print(
                    f"Could not delete transcript file: {e}"
                )

    # -----------------------------------------
    # DELETE DATABASE RECORD
    # -----------------------------------------

    db.delete(video)

    db.commit()

    return {

        "message":
            "Video deleted successfully",

        "video_id":
            video_id

    }