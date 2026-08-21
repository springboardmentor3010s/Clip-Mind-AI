from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth import decode_access_token
from database import SessionLocal
from models import User


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    email = payload.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: email missing"
        )

    # ==========================================
    # ALWAYS GET CURRENT ROLE FROM DATABASE
    # ==========================================

    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found"
            )

        role = str(
            user.role or ""
        ).strip().lower()

    finally:
        db.close()

    # Put the CURRENT database role into user payload
    payload["role"] = role

    print("========== AUTH DEBUG ==========")
    print("USER:", email)
    print("DATABASE ROLE:", role)
    print("================================")

    return payload


def require_role(*allowed_roles):

    allowed = {
        str(role).strip().lower()
        for role in allowed_roles
    }

    def role_checker(
        current_user=Depends(get_current_user)
    ):
        user_role = str(
            current_user.get("role", "")
        ).strip().lower()

        print("========== RBAC DEBUG ==========")
        print("USER:", current_user.get("email"))
        print("USER ROLE:", user_role)
        print("ALLOWED:", allowed)
        print("================================")

        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Role '{user_role}' does not have permission"
                )
            )

        return current_user

    return role_checker