from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, require_user, require_admin
from app.core.security import hash_password, verify_password
from app.core.audit import record_audit_event
from app.models.user import User
from app.models.role import Role
from app.models.analytics import AnalyticsEvent
from app.models.video import Video
from app.schemas.user import (
    UserProfileResponse,
    UserProfileUpdate,
    PasswordChangeRequest,
    UserRoleUpdate,
    ActivityEventResponse,
    UserResponse,
)

router = APIRouter(prefix="/users", tags=["users"])


def _to_profile_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role.name,
        "created_at": user.created_at,
    }


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(require_user)):
    return _to_profile_response(current_user)


@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if req.username is not None:
        existing = db.query(User).filter(
            User.username == req.username, User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = req.username

    if req.email is not None:
        existing = db.query(User).filter(
            User.email == req.email, User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = req.email

    db.commit()
    db.refresh(current_user)
    return _to_profile_response(current_user)


@router.put("/me/password")
def change_my_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/me/activity", response_model=List[ActivityEventResponse])
def get_my_activity(
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    events = (
        db.query(AnalyticsEvent)
        .filter(AnalyticsEvent.user_id == current_user.id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(50)
        .all()
    )

    results = []
    for e in events:
        results.append({
            "id": e.id,
            "event_type": e.event_type,
            "video_id": e.video_id,
            "video_title": e.video.title if e.video else None,
            "metadata_val": e.metadata_val,
            "created_at": e.created_at,
        })
    return results


@router.get("", response_model=List[UserProfileResponse])
def list_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    return [_to_profile_response(u) for u in users]


@router.patch("/{user_id}/role", response_model=UserProfileResponse)
def update_user_role(
    user_id: str,
    req: UserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.name == req.role).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found")

    old_role = user.role.name
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    record_audit_event(
        db, current_user.id, "role_changed", target_type="user", target_id=user.id,
        detail=f"{user.username}: {old_role} -> {role.name}",
    )
    return _to_profile_response(user)
