from sqlalchemy.orm import Session

from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


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