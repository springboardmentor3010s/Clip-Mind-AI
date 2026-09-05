import os

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from sqlalchemy.orm import joinedload

from app.schemas.platform_setting import (
    PlatformSettingResponse,
    PlatformSettingUpdate
)

from app.crud.platform_setting import (
    get_platform_settings,
    update_platform_settings
)

from app.models.video import Video

from app.database.connection import get_db
from app.auth.authorization import require_roles
from app.core.enums import UserRole, ActivityType, VideoStatus
from app.schemas.user import UserCreate, UserResponse
from app.crud.user import (
    create_user,
    get_user_by_email,
    get_user_by_username
)

from app.crud.video import (
    get_all_videos_for_admin,
    delete_video
)
from app.models.user import User

from app.services.activity_service import log_activity
from app.crud.activity_history import get_all_activities


router = APIRouter(
    prefix="/admin",
    tags=["Administrator"]
)


# ============================================================
# GET ALL USERS
# Administrator only
# ============================================================

@router.get(
    "/users",
    response_model=List[UserResponse]
)
def get_all_users(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    users = db.query(User).order_by(
        User.id.asc()
    ).all()

    return users

# ============================================================
# GET ALL PLATFORM ACTIVITY
# Administrator only
# ============================================================

@router.get(
    "/activity"
)
def get_platform_activity(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    activities = get_all_activities(
        db=db
    )

    return activities

# ============================================================
# GET ALL UPLOADED VIDEOS
# Administrator only
# ============================================================

@router.get(
    "/videos"
)
def get_all_uploaded_videos(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    videos = get_all_videos_for_admin(
        db=db
    )

    return videos

# ============================================================
# DELETE UPLOADED VIDEO
# Administrator only
# ============================================================

@router.delete(
    "/videos/{video_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_uploaded_video(
    video_id: int,
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find the video
    # --------------------------------------------------------

    video = (
        db.query(Video)
        .filter(
            Video.id == video_id
        )
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # --------------------------------------------------------
    # Save filename before deletion
    # --------------------------------------------------------

    video_filename = video.filename

    # --------------------------------------------------------
    # Delete video and associated content
    # --------------------------------------------------------

    delete_video(
        db=db,
        video=video
    )

    # --------------------------------------------------------
    # Log administrator action
    # --------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.PROFILE_UPDATED,
        entity_name=(
            f"Admin deleted uploaded video: "
            f"{video_filename}"
        )
    )

    return None


# ============================================================
# CREATE USER
# Administrator only
#
# Admin can create:
# - Learner
# - Educator
# - Content Creator
# - Administrator
# ============================================================

@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def create_user_by_admin(
    user: UserCreate,
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Check email
    # --------------------------------------------------------

    existing_email = get_user_by_email(
        db,
        user.email
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --------------------------------------------------------
    # Check username
    # --------------------------------------------------------

    existing_username = get_user_by_username(
        db,
        user.username
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # --------------------------------------------------------
    # Create the user
    # --------------------------------------------------------

    new_user = create_user(
        db=db,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        password=user.password,
        role=user.role
    )

    # --------------------------------------------------------
    # Log administrator action
    # --------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.REGISTER,
        entity_name=(
            f"Admin created user: "
            f"{new_user.username}"
        )
    )

    return new_user


# ============================================================
# PROMOTE USER TO ADMIN
# Administrator only
#
# IMPORTANT:
# An Admin can only change another user's role TO ADMIN.
# An Admin cannot:
# - change their own role
# - change another user's role to Learner
# - change another user's role to Educator
# - change another user's role to Content Creator
# ============================================================

@router.put(
    "/users/{user_id}/role",
    response_model=UserResponse
)
def update_user_role(
    user_id: int,
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find the target user
    # --------------------------------------------------------

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # Prevent Admin from changing their own role
    # --------------------------------------------------------

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own role"
        )

    # --------------------------------------------------------
    # Promote the target user to ADMIN
    # --------------------------------------------------------

    old_role = user.role

    user.role = UserRole.ADMIN

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Log role change
    # --------------------------------------------------------

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.PROFILE_UPDATED,
        entity_name=(
            f"Promoted user {user.username} "
            f"from {old_role} to ADMIN"
        )
    )

    return user


# ============================================================
# ACTIVATE / DEACTIVATE USER
# Administrator only
# ============================================================

@router.put(
    "/users/{user_id}/status",
    response_model=UserResponse
)
def update_user_status(
    user_id: int,
    is_active: bool,
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Find the target user
    # --------------------------------------------------------

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # Prevent Admin from disabling themselves
    # --------------------------------------------------------

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own account status"
        )

    # --------------------------------------------------------
    # Update account status
    # --------------------------------------------------------

    user.is_active = is_active

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Log status change
    # --------------------------------------------------------

    action = (
        "activated"
        if is_active
        else "deactivated"
    )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.PROFILE_UPDATED,
        entity_name=(
            f"{action} user: "
            f"{user.username}"
        )
    )

    return user

# ============================================================
# SYSTEM ANALYTICS
# Administrator only
# ============================================================

@router.get(
    "/analytics"
)
def get_system_analytics(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # USER ANALYTICS
    # --------------------------------------------------------

    total_users = db.query(User).count()

    active_users = db.query(User).filter(
        User.is_active == True
    ).count()

    inactive_users = db.query(User).filter(
        User.is_active == False
    ).count()

    total_admins = db.query(User).filter(
        User.role == UserRole.ADMIN
    ).count()

    total_educators = db.query(User).filter(
        User.role == UserRole.EDUCATOR
    ).count()

    total_content_creators = db.query(User).filter(
        User.role == UserRole.CONTENT_CREATOR
    ).count()

    total_learners = db.query(User).filter(
        User.role == UserRole.LEARNER
    ).count()

    # --------------------------------------------------------
    # VIDEO ANALYTICS
    # --------------------------------------------------------

    total_videos = db.query(Video).count()

    completed_videos = db.query(Video).filter(
        Video.status == VideoStatus.COMPLETED.value
    ).count()

    processing_videos = db.query(Video).filter(
        Video.status == VideoStatus.PROCESSING.value
    ).count()

    failed_videos = db.query(Video).filter(
        Video.status == VideoStatus.FAILED.value
    ).count()

    # --------------------------------------------------------
    # STORAGE ANALYTICS
    # --------------------------------------------------------

    videos = db.query(Video).all()

    total_storage_bytes = sum(
        video.file_size or 0
        for video in videos
    )

    total_storage_mb = round(
        total_storage_bytes / (1024 * 1024),
        2
    )

    total_storage_gb = round(
        total_storage_bytes / (1024 * 1024 * 1024),
        2
    )

    # --------------------------------------------------------
    # VIDEO DURATION ANALYTICS
    # --------------------------------------------------------

    total_duration_seconds = sum(
        video.duration or 0
        for video in videos
    )

    total_duration_minutes = round(
        total_duration_seconds / 60,
        2
    )

    # --------------------------------------------------------
    # RETURN ANALYTICS
    # --------------------------------------------------------

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "inactive": inactive_users,
            "admins": total_admins,
            "educators": total_educators,
            "content_creators": total_content_creators,
            "learners": total_learners
        },

        "videos": {
            "total": total_videos,
            "completed": completed_videos,
            "processing": processing_videos,
            "failed": failed_videos
        },

        "storage": {
            "total_bytes": total_storage_bytes,
            "total_mb": total_storage_mb,
            "total_gb": total_storage_gb
        },

        "processing": {
            "total_video_duration_seconds": total_duration_seconds,
            "total_video_duration_minutes": total_duration_minutes
        }
    }

# ============================================================
# GET AI PROCESSING JOBS
# Administrator only
# ============================================================

@router.get(
    "/processing-jobs"
)
def get_ai_processing_jobs(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    processing_videos = (
        db.query(Video)
        .options(joinedload(Video.owner))
        .filter(
            Video.status == VideoStatus.PROCESSING.value
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    completed_videos = (
        db.query(Video)
        .options(joinedload(Video.owner))
        .filter(
            Video.status == VideoStatus.COMPLETED.value
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    failed_videos = (
        db.query(Video)
        .options(joinedload(Video.owner))
        .filter(
            Video.status == VideoStatus.FAILED.value
        )
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    def serialize_video(video):
        return {
            "id": video.id,
            "filename": video.filename,
            "owner_id": video.owner_id,
            "owner_username": (
                video.owner.username
                if video.owner
                else None
            ),
            "duration": video.duration,
            "status": video.status,
            "created_at": video.created_at
        }

    return {
        "processing": [
            serialize_video(video)
            for video in processing_videos
        ],
        "completed": [
            serialize_video(video)
            for video in completed_videos
        ],
        "failed": [
            serialize_video(video)
            for video in failed_videos
        ],
        "counts": {
            "processing": len(processing_videos),
            "completed": len(completed_videos),
            "failed": len(failed_videos),
            "total": (
                len(processing_videos)
                + len(completed_videos)
                + len(failed_videos)
            )
        }
    }

# ============================================================
# GET PLATFORM SETTINGS
# Administrator only
# ============================================================

@router.get(
    "/settings",
    response_model=PlatformSettingResponse
)
def get_settings(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    settings = get_platform_settings(
        db=db
    )

    return settings


# ============================================================
# UPDATE PLATFORM SETTINGS
# Administrator only
# ============================================================

@router.put(
    "/settings",
    response_model=PlatformSettingResponse
)
def update_settings(
    settings_data: PlatformSettingUpdate,
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    settings = get_platform_settings(
        db=db
    )

    settings = update_platform_settings(
        db=db,
        settings=settings,
        maintenance_mode=(
            settings_data.maintenance_mode
        ),
        ai_processing_enabled=(
            settings_data.ai_processing_enabled
        ),
        max_upload_size_mb=(
            settings_data.max_upload_size_mb
        ),
        allow_public_registration=(
            settings_data.allow_public_registration
        )
    )

    log_activity(
        db=db,
        user=current_user,
        activity_type=ActivityType.PROFILE_UPDATED,
        entity_name="Administrator updated platform settings"
    )

    return settings

# ============================================================
# GET STORAGE UTILIZATION
# Administrator only
# ============================================================

@router.get(
    "/storage"
)
def get_storage_utilization(
    current_user=Depends(
        require_roles(UserRole.ADMIN)
    ),
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .order_by(
            Video.created_at.desc()
        )
        .all()
    )

    total_files = 0
    total_bytes = 0
    existing_files = 0
    missing_files = 0

    missing_file_list = []

    for video in videos:

        if video.file_size:
            total_bytes += video.file_size

        total_files += 1

        if video.filepath and os.path.exists(
            video.filepath
        ):
            existing_files += 1

        else:
            missing_files += 1

            missing_file_list.append({
                "id": video.id,
                "filename": video.filename,
                "filepath": video.filepath,
                "owner_id": video.owner_id,
                "created_at": video.created_at
            })

    total_mb = total_bytes / (
        1024 * 1024
    )

    total_gb = total_bytes / (
        1024 * 1024 * 1024
    )

    return {
        "storage": {
            "total_files": total_files,
            "existing_files": existing_files,
            "missing_files": missing_files,
            "total_bytes": total_bytes,
            "total_mb": round(
                total_mb,
                2
            ),
            "total_gb": round(
                total_gb,
                2
            ),
            "missing_file_list": missing_file_list
        }
    }