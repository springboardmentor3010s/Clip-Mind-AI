"""
Pydantic schemas for the Classroom module.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClassroomCreate(BaseModel):
    name: str


class ClassroomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    educator_id: uuid.UUID
    educator_name: str | None = None
    invite_code: str
    student_count: int = 0
    created_at: datetime


class ClassroomJoin(BaseModel):
    invite_code: str


class ClassroomMemberOut(BaseModel):
    id: uuid.UUID  # membership id
    student_id: uuid.UUID
    full_name: str
    email: str
    joined_at: datetime