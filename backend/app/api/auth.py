from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.platform_settings_store import get_platform_settings
from app.schemas.user import UserCreate, UserLogin, FirebaseLoginRequest
from app.services.auth_service import register_user, login_user, firebase_login

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


@router.post("/firebase-login")
def firebase_login_endpoint(req: FirebaseLoginRequest, db: Session = Depends(get_db)):

    # A role is only ever sent when the frontend is about to provision a new
    # account, so gate that path the same way /auth/register is gated.
    # Signing back in on an existing account must keep working regardless.
    if req.role is not None:
        settings = get_platform_settings(db)
        if not settings.allow_new_registrations:
            raise HTTPException(
                status_code=503,
                detail="New account registration is currently disabled by the platform administrator.",
            )

    result = firebase_login(db, req.id_token, req.role, req.username)

    if result.get("error") == "invalid_token":
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token.")
    if result.get("error") == "invalid_role":
        raise HTTPException(status_code=400, detail="Invalid role selection.")

    if result.get("needs_role"):
        return {"needs_role": True}

    # Only a brand-new account creation is gated by the registration toggle —
    # an existing account's Firebase sign-in must keep working regardless.
    if "access_token" not in result:
        raise HTTPException(status_code=400, detail="Firebase sign-in failed.")

    return result