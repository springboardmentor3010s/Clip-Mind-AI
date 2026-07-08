# backend/app/models/user.py
from enum import Enum
from sqlalchemy import Column, Integer, String
from pydantic import BaseModel, EmailStr
from app.core.database import Base

# ==========================================
# 1. Role Enum Definition (Required by Auth Router)
# ==========================================
class UserRole(str, Enum):
    LEARNER = "Learner"
    CREATOR = "Content Creator"
    EDUCATOR = "Educator"
    ADMIN = "Administrator"

# ==========================================
# 2. SQLAlchemy Model (For PostgreSQL Storage)
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.LEARNER.value)

# ==========================================
# 3. Pydantic Schemas (For FastAPI Request/Response Validation)
# ==========================================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "Learner"

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models smoothly