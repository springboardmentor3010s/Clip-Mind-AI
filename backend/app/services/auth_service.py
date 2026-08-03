from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserCreate
from app.utils.hashing import hash_password


def create_user(db: Session, user: UserCreate):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return None

    # Hash password
    hashed_password = hash_password(user.password)

    # Create User object
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role= user.role
    )

    # Save to database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
from app.utils.hashing import verify_password

from sqlalchemy import or_
from app.utils.hashing import verify_password

def authenticate_user(db: Session, login: str, password: str):

    # Find user by username OR email
    user = db.query(User).filter(
        or_(
            User.email == login,
            User.username == login
        )
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user
