from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extracts the current user from the JWT token.
    Returns None if no token is provided (allows optional auth).
    Raises 401 if a token is provided but is invalid.
    """
    if token is None:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Raises 401 if no valid token was provided."""
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


def require_admin(
    current_user: User = Depends(require_user)
) -> User:
    """Raises 403 unless the current user is an Administrator."""
    if current_user.role.name != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


def require_role(*allowed_roles: str):
    """Dependency factory: raises 403 unless the current user's role is one of
    `allowed_roles`. Administrator is always allowed, regardless of the list,
    since admins can act on behalf of the platform in every content area."""
    def _check(current_user: User = Depends(require_user)) -> User:
        role_name = current_user.role.name
        if role_name != "Administrator" and role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(allowed_roles)}.",
            )
        return current_user
    return _check


def require_content_manager(
    current_user: User = Depends(require_role("Creator", "Educator"))
) -> User:
    """Raises 403 unless the current user can create/manage content
    (Creator, Educator, or Administrator) — Learners are read-only."""
    return current_user