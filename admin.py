"""
Admin router: administrative endpoints for user and role management.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.schemas.role import RoleRead, RoleUpdate
from app.services.user_service import UserService
from app.services.auth_service import AuthService
from app.services.activity_service import log_activity
from app.auth.dependencies import get_admin_user
from app.models.role import Role
from app.models.user import User
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.summary import Summary


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


class AdminRoleUpdate(BaseModel):
    role_name: str = Field(..., min_length=1, max_length=50)


class AdminStatusUpdate(BaseModel):
    is_active: bool


def user_with_stats(db: Session, user: User) -> dict:
    """Return a user with the activity data shown in the admin console."""
    video_ids = db.query(Video.id).filter(Video.user_id == user.id).subquery()
    video_count = db.query(func.count(Video.id)).filter(Video.user_id == user.id).scalar() or 0
    transcript_count = db.query(func.count(Transcript.id)).filter(Transcript.video_id.in_(video_ids)).scalar() or 0
    summary_count = db.query(func.count(Summary.id)).filter(Summary.video_id.in_(video_ids)).scalar() or 0
    storage = db.query(func.coalesce(func.sum(Video.file_size), 0)).filter(Video.user_id == user.id).scalar() or 0
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
        "role_id": user.role_id,
        "role": user.role,
        "role_name": user.role,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "last_login": None,
        "stats": {
            "videos": video_count,
            "transcripts": transcript_count,
            "summaries": summary_count,
            "quizzes": 0,
            "storage": storage,
        },
    }


def require_target(db: Session, user_id: int) -> User:
    user = UserService.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/dashboard")
def get_dashboard(current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """Return platform-wide counts for the administrator dashboard."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    admin_users = db.query(func.count(User.id)).filter(User.role == "Administrator").scalar() or 0
    total_videos = db.query(func.count(Video.id)).scalar() or 0
    total_transcripts = db.query(func.count(Transcript.id)).scalar() or 0
    total_summaries = db.query(func.count(Summary.id)).scalar() or 0
    total_storage = db.query(func.coalesce(func.sum(Video.file_size), 0)).scalar() or 0
    return {
        "total_users": total_users,
        "active_users": active_users,
        "blocked_users": total_users - active_users,
        "admin_users": admin_users,
        "total_videos": total_videos,
        "total_transcripts": total_transcripts,
        "total_summaries": total_summaries,
        "total_storage": total_storage,
    }


@router.get("/users", response_model=List[UserRead])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Get a list of all users.

    Requires Administrator role.
    """
    users = UserService.get_all_users(db, skip=skip, limit=limit)
    return [user_with_stats(db, user) for user in users]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, request: Request, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """Create a user account from the administration console."""
    try:
        user = AuthService.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    log_activity(
        db, user_id=current_user.id, action="admin.user.create",
        resource_type="user", resource_id=user.id,
        description=f"Administrator created user {user.email}",
        request=request,
    )
    return user


@router.get("/users/{user_id}")
def get_user_by_id(
    user_id: int,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific user by ID.

    Requires Administrator role.
    """
    return user_with_stats(db, require_target(db, user_id))


@router.put("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    return UserService.update_user_profile(db, require_target(db, user_id), payload)


@router.patch("/users/{user_id}/role", response_model=UserRead)
def change_user_role(user_id: int, payload: AdminRoleUpdate, request: Request, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Assign a new role to a user.

    Requires Administrator role.
    """
    user = require_target(db, user_id)
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own administrator role")
    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if role is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
    user.role_id, user.role = role.id, role.name
    db.commit()
    db.refresh(user)
    log_activity(
        db, user_id=current_user.id, action="admin.user.role_change",
        resource_type="user", resource_id=user.id,
        description=f"Administrator changed role of {user.email} to {user.role}",
        request=request,
    )
    return user


@router.patch("/users/{user_id}/status", response_model=UserRead)
def change_user_status(user_id: int, payload: AdminStatusUpdate, request: Request, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Activate or block a user account.

    Requires Administrator role.
    """
    user = require_target(db, user_id)
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot block your own account")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    log_activity(
        db, user_id=current_user.id, action="admin.user.status_change",
        resource_type="user", resource_id=user.id,
        description=f"Administrator {'blocked' if not payload.is_active else 'activated'} {user.email}",
        request=request,
    )
    return user


@router.patch("/users/{user_id}/reset-password")
def reset_user_password(user_id: int, request: Request, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """Validate a reset request. Email/token delivery can be connected by deployment configuration."""
    user = require_target(db, user_id)
    log_activity(
        db, user_id=current_user.id, action="admin.user.reset_password",
        resource_type="user", resource_id=user.id,
        description=f"Administrator requested password reset for {user.email}",
        request=request,
    )
    return {"message": f"Password reset request created for {user.email}"}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_id(user_id: int, request: Request, current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Delete a user by ID.

    Requires Administrator role.
    """
    user = require_target(db, user_id)
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    UserService.delete_user(db, user)
    log_activity(
        db, user_id=current_user.id, action="admin.user.delete",
        resource_type="user", resource_id=user.id,
        description=f"Administrator deleted user {user.email}",
        request=request,
    )
    return None


@router.get("/roles", response_model=List[RoleRead])
def list_roles(
    skip: int = 0,
    limit: int = 100,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    List all roles.

    Requires Administrator role.
    """
    return db.query(Role).offset(skip).limit(limit).all()


@router.put("/roles", response_model=RoleRead)
def update_role(
    role_id: int,
    payload: RoleUpdate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Update a role by ID.

    - **role_id**: The role ID to update (query parameter)
    - **payload**: Role update data (name and/or description)

    Requires Administrator role.
    """
    from app.models.role import Role

    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(role, field, value)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.delete("/user/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Delete a user by ID.

    Requires Administrator role.
    """
    user = require_target(db, user_id)
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")
    UserService.delete_user(db, user)
    return None