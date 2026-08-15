from sqlalchemy.orm import Session

from app.models.user import User
from app.auth.hashing import hash_password, verify_password
from app.core.enums import UserRole


def get_user_by_email(
    db: Session,
    email: str
):
    return db.query(User).filter(
        User.email == email
    ).first()

def get_user_by_username(
    db: Session,
    username: str
):
    return db.query(User).filter(
        User.username == username
    ).first()


def create_user(
    db: Session,
    username: str,
    full_name: str,
    email: str,
    password: str,
    role: UserRole
):

    hashed_password = hash_password(password)

    new_user = User(
        username=username,
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = get_user_by_email(
        db,
        email
    )

    if not user:
        return None

    if not verify_password(
        password,
        user.hashed_password
    ):
        return None

    return user
def update_user_profile(
    db: Session,
    user: User,
    username: str,
    full_name: str
):

    user.username = username
    user.full_name = full_name

    db.commit()
    db.refresh(user)

    return user