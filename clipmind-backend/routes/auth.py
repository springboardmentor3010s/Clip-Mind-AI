import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.db_models import User
from services import activity_service
from models.schemas import (
    AuthResponse,
    ForgotPasswordBody,
    LoginBody,
    RegisterBody,
    UpdateProfileBody,
)

router = APIRouter(tags=["auth"])

JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "clipmind-local-development-secret",
)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    salt = os.urandom(16)

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        120_000,
    )

    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        salt = bytes.fromhex(salt_hex)

        computed = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            120_000,
        )

        return hmac.compare_digest(
            computed.hex(),
            digest_hex,
        )
    except (ValueError, TypeError):
        return False


def create_token(user: User) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRE_HOURS),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        ) from exc

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    return user


def get_current_user_flexible(
    authorization: str | None = Header(default=None),
    token: str | None = None,
    db: Session = Depends(get_db),
) -> User:
    """
    Same as get_current_user, but also accepts the JWT as a `?token=`
    query param. Native <video>/<audio> elements issue byte-range
    GET requests directly from the browser and cannot attach a custom
    Authorization header, so the media-streaming endpoint needs this
    fallback while every other endpoint keeps using the header-only
    get_current_user.
    """
    raw = None

    if authorization and authorization.startswith("Bearer "):
        raw = authorization.removeprefix("Bearer ").strip()
    elif token:
        raw = token.strip()

    if not raw:
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        payload = jwt.decode(raw, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return user


def require_roles(*allowed_roles: str):
    def dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return dependency


@router.post("/register", response_model=AuthResponse)
def register(
    body: RegisterBody,
    db: Session = Depends(get_db),
):
    name = body.name.strip()
    email = body.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    if len(body.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters.",
        )

    allowed_roles = {
        "Content Creator",
        "Learner",
        "Educator",
        "Administrator",
    }

    if body.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role.",
        )

    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=email,
        password_hash=hash_password(body.password),
        role=body.role,
        institution=body.institution,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    activity_service.log(db, user.id, activity_service.REGISTER)

    return {
        "token": create_token(user),
        "user": user.to_record(),
    }


@router.post("/login", response_model=AuthResponse)
def login(
    body: LoginBody,
    db: Session = Depends(get_db),
):
    email = body.email.strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user or not verify_password(
        body.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    activity_service.log(db, user.id, activity_service.LOGIN)

    return {
        "token": create_token(user),
        "user": user.to_record(),
    }


@router.get("/me")
def me(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    return get_current_user(
        authorization=authorization,
        db=db,
    ).to_record()


@router.put("/me")
def update_me(
    body: UpdateProfileBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        if len(name) > 120:
            raise HTTPException(status_code=400, detail="Name is too long.")
        current_user.name = name

    if body.institution is not None:
        institution = body.institution.strip()
        current_user.institution = institution or None

    db.commit()
    db.refresh(current_user)

    activity_service.log(db, current_user.id, activity_service.PROFILE_UPDATED)

    return current_user.to_record()


@router.get("/me/stats")
def my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Real, DB-derived profile statistics for the current user. Every number
    here comes from the user's own Video rows -- nothing is hardcoded.
    """
    from models.db_models import Video

    videos = db.query(Video).filter(Video.user_id == current_user.id).all()

    videos_processed = sum(1 for v in videos if v.status == "Processed")

    total_seconds_saved = 0.0
    ai_actions = 0

    for v in videos:
        has_transcript = bool(v.transcript_json and v.transcript_json != "[]")
        has_summary = bool(v.summary_json)
        has_moments = bool(v.moments_json and v.moments_json != "[]")
        has_analytics = bool(v.analytics_json)

        ai_actions += sum([has_transcript, has_summary, has_moments, has_analytics])

        # "Watch time saved" = the video's full duration minus the estimated
        # reading time of its generated summary (at ~200 words/minute).
        # Only counted for videos that actually have a summary, since that
        # is the artifact that lets a viewer skip watching the full video.
        if has_summary and v.summary_json:
            try:
                summary = json.loads(v.summary_json)
                word_count = summary.get("wordCount") or 0
                read_seconds = (word_count / 200) * 60
                saved = max(0.0, (v.duration_seconds or 0) - read_seconds)
                total_seconds_saved += saved
            except (json.JSONDecodeError, TypeError):
                pass

    hours = int(total_seconds_saved // 3600)
    minutes = int((total_seconds_saved % 3600) // 60)

    return {
        "videosProcessed": videos_processed,
        "totalVideos": len(videos),
        "watchTimeSavedSeconds": round(total_seconds_saved),
        "watchTimeSavedLabel": f"{hours}h {minutes}m",
        "aiActions": ai_actions,
    }


@router.post("/forgot-password")
def forgot_password(
    body: ForgotPasswordBody,
):
    return {
        "success": True,
        "message": (
            "If an account exists for this email, "
            "reset instructions would be provided."
        ),
    }