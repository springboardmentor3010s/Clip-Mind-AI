from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class FirebaseLoginRequest(BaseModel):
    id_token: str
    role: Optional[str] = None
    username: Optional[str] = None


class FirebaseLoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    needs_role: bool = False


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class UserRoleUpdate(BaseModel):
    role: str


class ActivityEventResponse(BaseModel):
    id: int
    event_type: str
    video_id: Optional[int] = None
    video_title: Optional[str] = None
    metadata_val: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True