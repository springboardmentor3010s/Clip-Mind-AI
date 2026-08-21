from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
import os

from app.database import get_db
from app.models import User, Video
from app.utils.role_guard import require_roles


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# ADMIN STATISTICS
# =========================================================

@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()

    educators = (
        db.query(User)
        .filter(User.role == "educator")
        .count()
    )

    learners = (
        db.query(User)
        .filter(User.role == "learner")
        .count()
    )

    content_creators = (
        db.query(User)
        .filter(or_(User.role == "creator", User.role == "content_creator"))
        .count()
    )

    admins = (
        db.query(User)
        .filter(User.role == "admin")
        .count()
    )

    total_videos = db.query(Video).count()

    return {
        "total_users": total_users,
        "educators": educators,
        "learners": learners,
        "content_creators": content_creators,
        "admins": admins,
        "total_videos": total_videos,
    }


# =========================================================
# GET ALL USERS
# =========================================================

@router.get("/users")
def get_admin_users(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .order_by(User.id.desc())
        .all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
        for user in users
    ]


# =========================================================
# MAKE USER ADMIN
# =========================================================

@router.put("/users/{user_id}/make-admin")
def make_user_admin(
    user_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You are already an admin."
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=400,
            detail="User is already an admin."
        )

    user.role = "admin"

    db.commit()
    db.refresh(user)

    return {
        "message": "User promoted to admin successfully.",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }
    }


# =========================================================
# GET SINGLE USER
# =========================================================

@router.get("/users/{user_id}")
def get_admin_user(
    user_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    }


# =========================================================
# GET ALL VIDEOS
# =========================================================

@router.get("/videos")
def get_admin_videos(
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    videos = (
        db.query(Video)
        .order_by(Video.id.desc())
        .all()
    )

    return [
        {
            "id": video.id,
            "filename": video.filename,
            "original_filename": video.original_filename,
            "status": video.status,
            "uploaded_by": video.uploaded_by,
            "classroom_id": video.classroom_id,
            "transcript_available": bool(video.transcript),
            "summary_available": bool(video.summary),
        }
        for video in videos
    ]


# =========================================================
# GET SINGLE VIDEO
# =========================================================

@router.get("/videos/{video_id}")
def get_admin_video(
    video_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    return {
        "id": video.id,
        "filename": video.filename,
        "original_filename": video.original_filename,
        "status": video.status,
        "uploaded_by": video.uploaded_by,
        "classroom_id": video.classroom_id,
        "transcript_available": bool(video.transcript),
        "summary_available": bool(video.summary),
    }


# =========================================================
# DELETE VIDEO
# =========================================================

@router.delete("/videos/{video_id}")
def delete_admin_video(
    video_id: int,
    current_user: User = Depends(
        require_roles("admin")
    ),
    db: Session = Depends(get_db),
):
    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if video is None:
        raise HTTPException(
            status_code=404,
            detail="Video not found."
        )

    # Delete actual video file if it exists
    if video.file_path:
        try:
            if os.path.exists(video.file_path):
                os.remove(video.file_path)
        except Exception as e:
            print("File deletion error:", e)

    # Delete database record
    db.delete(video)
    db.commit()

    return {
        "message": "Video deleted successfully.",
        "video_id": video_id
    }