"""
Auth service — business logic for registration and login.
Kept separate from the API layer so it's reusable/testable.
"""
import uuid

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.config import settings
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    decode_token,
)
from app.services.email_service import send_password_reset_email


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def register_user(db: Session, payload: UserCreate) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )
    return user


def issue_tokens(user: User) -> dict:
    return {
        "access_token": create_access_token(subject=str(user.id), role=user.role.value),
        "refresh_token": create_refresh_token(subject=str(user.id)),
        "token_type": "bearer",
    }


def request_password_reset(db: Session, email: str) -> None:
    """
    Always succeeds from the caller's point of view — whether or not the
    email matches an account, so the endpoint can't be used to enumerate
    registered users. If it does match an active account, send a reset link.
    """
    user = get_user_by_email(db, email)
    if user and user.is_active:
        token = create_password_reset_token(subject=str(user.id))
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        send_password_reset_email(user.email, reset_link)


def reset_password(db: Session, token: str, new_password: str) -> None:
    decoded = decode_token(token)
    if decoded is None or decoded.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired.",
        )

    user = db.query(User).filter(User.id == uuid.UUID(decoded["sub"])).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has expired.",
        )

    user.hashed_password = hash_password(new_password)
    db.commit()