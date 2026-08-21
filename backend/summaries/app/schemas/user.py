from pydantic import BaseModel, EmailStr
from datetime import datetime


# ============================================
# User Registration
# ============================================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_id: int


# ============================================
# User Login
# ============================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================
# User Response
# ============================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Token Response
# ============================================

class Token(BaseModel):
    access_token: str
    token_type: str


# ============================================
# Token Payload
# ============================================

class TokenData(BaseModel):
    email: str | None = None