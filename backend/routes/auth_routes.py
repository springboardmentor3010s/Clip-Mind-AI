from fastapi import APIRouter, HTTPException
from database import SessionLocal
from models import User
from schemas import UserCreate, UserLogin
from auth import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter()


# =========================================================
# CANONICAL CLIPMIND ROLES
# =========================================================

ROLE_MAP = {
    "content creator": "content_creator",
    "content_creator": "content_creator",

    "learner": "learner",

    "educator": "educator",

    "administrator": "admin",
    "admin": "admin",

    "creator": "content_creator",
}


def normalize_role(role: str) -> str:
    value = str(role or "").strip().lower()
    return ROLE_MAP.get(value, value)


# =========================================================
# TEST
# =========================================================

@router.get("/test")
def test():
    return {
        "message": "Auth Route Working"
    }


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(user: UserCreate):

    db = SessionLocal()

    try:
        role = normalize_role(user.role)

        print("\n========== REGISTER REQUEST ==========")
        print("Name :", user.name)
        print("Email:", user.email)
        print("Raw Role:", user.role)
        print("Normalized Role:", role)

        allowed_roles = {
            "content_creator",
            "learner",
            "educator",
            "admin"
        }

        if role not in allowed_roles:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid role. Allowed roles are: "
                    "Content Creator, Learner, Educator, Administrator."
                )
            )

        existing_user = (
            db.query(User)
            .filter(User.email == user.email)
            .first()
        )

        if existing_user:
            return {
                "message": "Email already registered"
            }

        new_user = User(
            name=user.name,
            email=user.email,
            password=hash_password(user.password),
            role=role
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print("New User ID:", new_user.id)
        print("Stored Role:", new_user.role)
        print("Registration Successful")
        print("=====================================\n")

        return {
            "message": "User Registered Successfully",
            "user_id": new_user.id,
            "role": new_user.role
        }

    finally:
        db.close()


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(user: UserLogin):

    db = SessionLocal()

    try:

        print("\n========== LOGIN REQUEST ==========")
        print("Email:", user.email)

        db_user = (
            db.query(User)
            .filter(User.email == user.email)
            .first()
        )

        if not db_user:
            return {
                "message": "User not found"
            }

        if not verify_password(
            user.password,
            db_user.password
        ):
            return {
                "message": "Incorrect password"
            }

        # Normalize old database roles automatically
        normalized_role = normalize_role(db_user.role)

        if normalized_role != db_user.role:
            db_user.role = normalized_role
            db.commit()
            db.refresh(db_user)

        access_token = create_access_token(
            user_id=db_user.id,
            email=db_user.email,
            role=normalized_role
        )

        print("Login Successful")
        print("Role:", normalized_role)
        print("==================================\n")

        return {
            "message": "Login Successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": db_user.name,
            "user_id": db_user.id,
            "email": db_user.email,
            "role": normalized_role
        }

    finally:
        db.close()