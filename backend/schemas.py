from pydantic import BaseModel, EmailStr
from typing import Optional


# ---------------- Register Schema ----------------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "Learner"  # Role added with default value


# ---------------- Login Schema ----------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # Optional so login won't fail if role is omitted


# ---------------- User Response Schema ----------------

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


# ---------------- Video Response Schema ----------------

class VideoResponse(BaseModel):
    id: int
    user_id: int
    video_name: str
    file_path: str

    class Config:
        from_attributes = True