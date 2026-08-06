from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):

    title: str

    description: Optional[str] = None

    category: Optional[str] = None

    difficulty: Optional[str] = None

    thumbnail: Optional[str] = None


class CourseUpdate(BaseModel):

    title: Optional[str] = None

    description: Optional[str] = None

    category: Optional[str] = None

    difficulty: Optional[str] = None

    thumbnail: Optional[str] = None


class CourseResponse(BaseModel):

    id: int

    title: str

    description: Optional[str]

    category: Optional[str]

    difficulty: Optional[str]

    thumbnail: Optional[str]

    educator_id: int

    created_at: datetime

    class Config:

        from_attributes = True