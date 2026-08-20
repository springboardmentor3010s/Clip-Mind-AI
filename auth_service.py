"""
Authentication service: handles registration, login, and token management.
"""
from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import RegisterRequest


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def get_role_by_name(db: Session, role_name: str) -> Optional[Role]:
        """Fetch a role by its name."""
        return db.query(Role).filter(Role.name == role_name).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch a user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """Fetch a user by username."""
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def register_user(db: Session, payload: RegisterRequest) -> User:
        """
        Register a new user.

        Args:
            db: Database session.
            payload: Registration data.

        Returns:
            The created User object.

        Raises:
            ValueError: If email or username already exists, or role not found.
        """
        # Check for existing email
        if AuthService.get_user_by_email(db, payload.email):
            raise ValueError("Email already registered")

        # Check for existing username
        if AuthService.get_user_by_username(db, payload.username):
            raise ValueError("Username already taken")

        # Get or create role
        role = AuthService.get_role_by_name(db, payload.role_name)
        if role is None:
            raise ValueError(f"Role '{payload.role_name}' not found")

        # Create user
        hashed_password = hash_password(payload.password)
        user = User(
            email=payload.email,
            username=payload.username,
            full_name=payload.full_name,
            hashed_password=hashed_password,
            role_id=role.id,
            role=payload.role_name,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str, role_name: Optional[str] = None) -> Optional[User]:
        """
        Authenticate a user by email and password.

        Args:
            db: Database session.
            email: User's email.
            password: User's plain password.
            role_name: Optional role name to filter by.

        Returns:
            The authenticated User object, or None if authentication fails.
        """
        user = AuthService.get_user_by_email(db, email)
        if user is None:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        if role_name and user.role != role_name:
            return None
        return user

    @staticmethod
    def create_token(user: User) -> str:
        """
        Create a JWT access token for the given user.

        Args:
            user: The authenticated user.

        Returns:
            JWT token string.
        """
        role_name = user.role or "Learner"

        access_token_expires = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        return create_access_token(
            data={
                "sub": str(user.id),
                "email": user.email,
                "username": user.username,
                "role": role_name,
            },
            expires_delta=access_token_expires,
        )
