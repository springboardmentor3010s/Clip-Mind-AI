from typing import Optional
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =====================================================
# CREATE CLASSROOM
# =====================================================

class ClassroomCreate(BaseModel):

    name: str
    description: Optional[str] = None


# =====================================================
# CLASSROOM RESPONSE
# =====================================================

class ClassroomResponse(BaseModel):

    id: int
    name: str
    description: Optional[str] = None
    join_code: str
    educator_id: int
    student_count: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )


# =====================================================
# JOIN CLASSROOM
# =====================================================

class ClassroomJoin(BaseModel):

    join_code: str


# =====================================================
# CREATE CLASSROOM POST
# =====================================================

class ClassroomPostCreate(BaseModel):

    title: str
    content: Optional[str] = None
    post_type: str = "announcement"
    video_id: Optional[int] = None

# =====================================================
# CLASSROOM POST RESPONSE
# =====================================================

class ClassroomPostResponse(BaseModel):

    id: int
    classroom_id: int
    title: str
    content: Optional[str] = None
    post_type: str
    file_path: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        from_attributes=True
    )