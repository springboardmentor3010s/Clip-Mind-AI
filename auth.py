"""
Authentication schemas (Pydantic models).
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, EmailStr, field_validator

class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request body."""
    email: EmailStr
    password: str = Field(..., min_length=1)
    role_name: Optional[str] = Field(default=None)


class RegisterRequest(BaseModel):
    """Registration request body."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    role_name: str = Field(default="Learner")

    @field_validator("role_name")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed_roles = ["Learner", "Content Creator", "Educator"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v
