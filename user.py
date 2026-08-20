"""
User schemas (Pydantic models).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr, field_validator

class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8, max_length=128)
    role_name: str = Field(default="Learner")

    @field_validator("role_name")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed_roles = ["Administrator", "Content Creator", "Educator", "Learner"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v


class UserRead(BaseModel):
    """Schema for reading a user."""
    id: int
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    is_verified: bool
    role_id: int
    role: str = "Learner"
    role_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None


class UserProfile(BaseModel):
    """Schema for user profile (public)."""
    id: int
    email: EmailStr
    username: str
    full_name: str
    role_name: str
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
