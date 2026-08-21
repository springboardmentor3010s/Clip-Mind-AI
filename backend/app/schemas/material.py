from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# =====================================================
# Create Material Schema
# =====================================================

class MaterialCreate(BaseModel):
    video_id: int
    educator_id: int
    title: str
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_type: str


# =====================================================
# Update Material Schema
# =====================================================

class MaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None


# =====================================================
# Material Response Schema
# =====================================================

class MaterialResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    file_name: str
    file_path: str
    file_type: str
    video_id: int
    educator_id: int
    created_at: datetime

    class Config:
        from_attributes = True