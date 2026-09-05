from datetime import datetime

from pydantic import BaseModel, EmailStr
from app.core.enums import UserRole


class UserCreate(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: str
    full_name: str