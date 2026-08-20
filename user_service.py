"""
User service: handles user profile management and queries.
"""
from typing import Optional, List

from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserUpdate


class UserService:
    """Service for user management operations."""

    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """Fetch a user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch a user by email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_with_role(db: Session, user_id: int) -> Optional[User]:
        """Fetch a user with their role eagerly loaded."""
        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )

    @staticmethod
    def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update_user_profile(
        db: Session,
        user: User,
        payload: UserUpdate,
    ) -> User:
        """
        Update a user's profile.

        Args:
            db: Database session.
            user: The user to update.
            payload: Update data.

        Returns:
            The updated user.
        """
        update_data = payload.model_dump(exclude_unset=True)
        new_email = update_data.get("email")
        if new_email and new_email != user.email:
            existing_user = UserService.get_user_by_email(db, new_email)
            if existing_user and existing_user.id != user.id:
                raise ValueError("Email already registered")
        for field, value in update_data.items():
            setattr(user, field, value)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def delete_user(db: Session, user: User) -> None:
        """Delete a user."""
        db.delete(user)
        db.commit()

    @staticmethod
    def get_user_profile(db: Session, user_id: int) -> Optional[dict]:
        """Get a user's profile data as a dict."""
        user = UserService.get_user_with_role(db, user_id)
        if user is None:
            return None
        role_name = user.role or "Learner"
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role_name": role_name,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at,
        }
