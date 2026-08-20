"""
Role schemas (Pydantic models).
"""
from typing import Optional

from pydantic import BaseModel, Field

class RoleBase(BaseModel):
    """Base role schema."""
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role."""
    pass


class RoleRead(RoleBase):
    """Schema for reading a role."""
    id: int

    model_config = {"from_attributes": True}


class RoleUpdate(BaseModel):
    """Schema for updating a role."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
