from typing import Callable

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.jwt import verify_token


security = HTTPBearer()

ROLE_ALIASES = {
    "content_creator": "creator",
    "content-creator": "creator",
}

def normalize_role(role: str | None) -> str | None:
    if role is None:
        return None
    value = role.strip().lower().replace("-", "_").replace(" ", "_")
    return ROLE_ALIASES.get(value, value)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    email = payload.get("sub")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


def require_roles(*allowed_roles: str) -> Callable:
    def role_dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:

        normalized_current_role = normalize_role(current_user.role)
        normalized_allowed_roles = {normalize_role(role) for role in allowed_roles}

        if normalized_current_role not in normalized_allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Access denied. Required role: "
                    f"{', '.join(allowed_roles)}"
                ),
            )

        return current_user

    return role_dependency