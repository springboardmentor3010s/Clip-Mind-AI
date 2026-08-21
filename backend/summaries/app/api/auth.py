from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.schemas.user import UserCreate, UserLogin
from app.services.auth_service import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Register User
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print("=" * 50)
        print("REGISTER API CALLED")
        print("User Data:", user)

        new_user = register_user(db, user)

        if not new_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        print("User registered successfully.")

        return {
            "message": "User registered successfully",
            "user_id": new_user.id
        }

    except Exception as e:
        print("=" * 50)
        print("REGISTER API ERROR")
        print(type(e).__name__)
        print(e)
        raise

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    try:

        token = login_user(
            db,
            user.email,
            user.password
        )

        if token is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        return token

    except Exception as e:
        print("LOGIN API ERROR:", e)
        raise