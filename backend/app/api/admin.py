from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.admin_service import (
    get_admin_dashboard,
    get_recent_users,
    get_recent_videos,
    get_user_distribution,
    get_video_status,
    get_all_users,
    update_user_role
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

# ==========================================
# Admin Dashboard
# ==========================================

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db)
):
    return get_admin_dashboard(db)


# ==========================================
# Recent Users
# ==========================================

@router.get("/recent-users")
def recent_users(
    db: Session = Depends(get_db)
):
    return {
        "users": get_recent_users(db)
    }


# ==========================================
# Recent Videos
# ==========================================

@router.get("/recent-videos")
def recent_videos(
    db: Session = Depends(get_db)
):
    return {
        "videos": get_recent_videos(db)
    }


# ==========================================
# User Distribution
# ==========================================

@router.get("/user-distribution")
def user_distribution(
    db: Session = Depends(get_db)
):
    return get_user_distribution(db)


# ==========================================
# Video Status
# ==========================================

@router.get("/video-status")
def video_status(
    db: Session = Depends(get_db)
):
    return get_video_status(db)


# ==========================================
# Get All Users
# ==========================================

@router.get("/users")
def all_users(
    db: Session = Depends(get_db)
):
    return {
        "users": get_all_users(db)
    }


# ==========================================
# Change User Role
# ==========================================

@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db)
):

    result = update_user_role(
        db,
        user_id,
        role
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    return result