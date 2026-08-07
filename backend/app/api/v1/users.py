"""
User management endpoints:
- self-service profile update (any authenticated user)
- admin-only user listing / activation / deactivation (RBAC demo)
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate, UserRoleUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Let a user update their own name / password (profile management)."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.password is not None:
        current_user.hashed_password = hash_password(payload.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_role(UserRole.ADMINISTRATOR))])
def list_users(db: Session = Depends(get_db)):
    """Admin-only: list all users on the platform."""
    return db.query(User).order_by(User.created_at.desc()).all()


def _get_user_or_404(db: Session, user_id: uuid.UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.patch(
    "/{user_id}/role",
    response_model=UserOut,
    dependencies=[Depends(require_role(UserRole.ADMINISTRATOR))],
)
def change_user_role(
    user_id: uuid.UUID,
    payload: UserRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only: change a user's role."""
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot change your own role.")
    user = _get_user_or_404(db, user_id)
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

@router.patch(
    "/{user_id}/deactivate",
    response_model=UserOut,
    dependencies=[Depends(require_role(UserRole.ADMINISTRATOR))],
)
def deactivate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin-only: deactivate a user account."""
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own account.")
    user = _get_user_or_404(db, user_id)
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/activate",
    response_model=UserOut,
    dependencies=[Depends(require_role(UserRole.ADMINISTRATOR))],
)
def activate_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Admin-only: reactivate a previously deactivated user account."""
    user = _get_user_or_404(db, user_id)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user