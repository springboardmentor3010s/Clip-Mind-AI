from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

ROLE_MAP = {
    1: "admin",
    2: "creator",
    3: "educator",
    4: "learner"
}


# ==========================================
# Register User
# ==========================================

def register_user(db: Session, user: UserCreate):

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return None

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password_hash=hash_password(user.password),
        role_id=user.role_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ==========================================
# Login User
# ==========================================

def login_user(db: Session, email: str, password: str):

    try:

        print("=" * 60)
        print("LOGIN ATTEMPT")
        print("Entered Email:", email)

        user = db.query(User).filter(
            User.email == email
        ).first()

        if user is None:
            print("❌ User not found")
            return None

        print("✅ User Found :", user.full_name)
        print("Database Email:", user.email)
        print("Role ID:", user.role_id)
        print("Stored Hash:", user.password_hash)
        print("Entered Password:", password)

        password_ok = verify_password(
            password,
            user.password_hash
        )

        print("Password Verified:", password_ok)

        if not password_ok:
            print("❌ Invalid Password")
            return None

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role_id": user.role_id
            }
        )

        response = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role_id": user.role_id,
                "role": ROLE_MAP.get(user.role_id, "learner"),
                "is_active": user.is_active
            }
        }

        print("✅ Login Successful")
        print("=" * 60)

        return response

    except Exception as e:

        print("=" * 60)
        print("LOGIN ERROR")
        print(type(e).__name__)
        print(str(e))
        print("=" * 60)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )