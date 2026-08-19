from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.platform_settings_store import get_platform_settings
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    settings = get_platform_settings(db)
    if not settings.allow_new_registrations:
        raise HTTPException(
            status_code=503,
            detail="New account registration is currently disabled by the platform administrator.",
        )

    new_user = register_user(db, user)

    if new_user is None:
        raise HTTPException(
            status_code=400,
            detail="Email already exists or role not found."
        )

    return {
        "message": "User registered successfully."
    }


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    token = login_user(
        db,
        user.email,
        user.password
    )

    if token is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    return token