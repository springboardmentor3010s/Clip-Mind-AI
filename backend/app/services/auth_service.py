import secrets

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.core.firebase import verify_firebase_id_token


SELF_REGISTERABLE_ROLES = {"Creator", "Learner", "Educator"}


def register_user(db: Session, user: UserCreate):

    # Administrator is never self-assignable at signup — only an existing
    # admin can promote a user to Administrator (PATCH /users/{id}/role).
    if user.role not in SELF_REGISTERABLE_ROLES:
        return None

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return None

    # Find selected role
    role = db.query(Role).filter(Role.name == user.role).first()

    if role is None:
        return None

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role_id=role.id,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def login_user(db: Session, email: str, password: str):

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role.name,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


def firebase_login(db: Session, id_token: str, role: str | None, username: str | None = None):
    """Authenticates via a Firebase ID token (email/password or Google).

    Firebase owns the credential — we only ever see a verified token, never
    a password. Local User rows stay the source of truth for role/RBAC, so
    a first-time Firebase sign-in provisions one here exactly like
    register_user() does, just without a real local password.
    """
    try:
        claims = verify_firebase_id_token(id_token)
    except ValueError:
        return {"error": "invalid_token"}

    email = claims.get("email")
    if not email:
        return {"error": "invalid_token"}

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        if role is None:
            return {"needs_role": True}

        if role not in SELF_REGISTERABLE_ROLES:
            return {"error": "invalid_role"}

        role_row = db.query(Role).filter(Role.name == role).first()
        if role_row is None:
            return {"error": "invalid_role"}

        chosen_username = (username or claims.get("name") or "").strip()
        username = chosen_username or email.split("@")[0]

        user = User(
            username=username,
            email=email,
            # Firebase is the credential owner for this account; this hash
            # is unreachable — the local password endpoints stay unusable
            # for it, matching how it will actually authenticate going forward.
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role_id=role_row.id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        {
            "sub": str(user.id),
            "role": user.role.name,
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }