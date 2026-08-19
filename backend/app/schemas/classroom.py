from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr


class ClassroomCreate(BaseModel):
    name: str


class StudentAdd(BaseModel):
    email: EmailStr


class VideoAssign(BaseModel):
    video_id: int


class StudentInfo(BaseModel):
    id: str
    username: str
    email: str
    joined_at: datetime


class VideoInfo(BaseModel):
    id: int
    title: str
    status: str
    added_at: datetime


class ClassroomResponse(BaseModel):
    id: int
    name: str
    educator_id: str
    educator_username: Optional[str] = None
    created_at: datetime
    student_count: int = 0
    video_count: int = 0


class ClassroomDetailResponse(ClassroomResponse):
    students: List[StudentInfo] = []
    videos: List[VideoInfo] = []
