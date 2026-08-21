from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.video import Video
from app.models.role import Role


# ==========================================
# Admin Dashboard
# ==========================================

def get_admin_dashboard(db: Session):

    total_users = db.query(User).count()

    total_videos = db.query(Video).count()

    uploaded_videos = (
        db.query(Video)
        .filter(Video.status == "Uploaded")
        .count()
    )

    processing_videos = (
        db.query(Video)
        .filter(Video.status == "Processing")
        .count()
    )

    completed_videos = (
        db.query(Video)
        .filter(Video.status == "Processed")
        .count()
    )

    admins = (
        db.query(User)
        .join(Role)
        .filter(func.lower(Role.role_name) == "admin")
        .count()
    )

    creators = (
        db.query(User)
        .join(Role)
        .filter(
            func.lower(Role.role_name).in_(
                ["content creator", "creator"]
            )
        )
        .count()
    )

    educators = (
        db.query(User)
        .join(Role)
        .filter(func.lower(Role.role_name) == "educator")
        .count()
    )

    learners = (
        db.query(User)
        .join(Role)
        .filter(func.lower(Role.role_name) == "learner")
        .count()
    )

    return {
        "total_users": total_users,
        "total_videos": total_videos,
        "uploaded_videos": uploaded_videos,
        "processing_videos": processing_videos,
        "completed_videos": completed_videos,
        "admins": admins,
        "content_creators": creators,
        "educators": educators,
        "learners": learners,
    }


# ==========================================
# Recent Users
# ==========================================

def get_recent_users(db: Session):

    users = (
        db.query(User)
        .order_by(User.id.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role.role_name if user.role else None,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ==========================================
# Recent Videos
# ==========================================

def get_recent_videos(db: Session):

    videos = (
        db.query(Video)
        .order_by(Video.id.desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": video.id,
            "title": video.title,
            "status": video.status,
            "duration": video.duration,
            "created_at": video.created_at,
        }
        for video in videos
    ]


# ==========================================
# User Distribution
# ==========================================

def get_user_distribution(db: Session):

    return {
        "admin": (
            db.query(User)
            .join(Role)
            .filter(func.lower(Role.role_name) == "admin")
            .count()
        ),
        "content_creator": (
            db.query(User)
            .join(Role)
            .filter(
                func.lower(Role.role_name).in_(
                    ["content creator", "creator"]
                )
            )
            .count()
        ),
        "educator": (
            db.query(User)
            .join(Role)
            .filter(func.lower(Role.role_name) == "educator")
            .count()
        ),
        "learner": (
            db.query(User)
            .join(Role)
            .filter(func.lower(Role.role_name) == "learner")
            .count()
        ),
    }


# ==========================================
# Video Status
# ==========================================

def get_video_status(db: Session):

    return {
        "uploaded": db.query(Video)
        .filter(Video.status == "Uploaded")
        .count(),

        "processing": db.query(Video)
        .filter(Video.status == "Processing")
        .count(),

        "processed": db.query(Video)
        .filter(Video.status == "Processed")
        .count(),
    }


# ==========================================
# Get All Users
# ==========================================

def get_all_users(db: Session):

    users = (
        db.query(User)
        .order_by(User.id)
        .all()
    )

    return [
        {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role.role_name if user.role else None,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ==========================================
# Update User Role
# ==========================================

def update_user_role(
    db: Session,
    user_id: int,
    role: str,
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        return {
            "success": False,
            "message": "User not found",
        }

    role_obj = (
        db.query(Role)
        .filter(func.lower(Role.role_name) == role.lower())
        .first()
    )

    if not role_obj:
        return {
            "success": False,
            "message": f"Role '{role}' not found",
        }

    user.role = role_obj

    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": "Role updated successfully",
        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role.role_name,
        },
    }