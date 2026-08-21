from pydantic import BaseModel
from typing import Optional, List


# ======================================================
# Video
# ======================================================

class EducatorVideoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration: Optional[float] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = None

    class Config:
        orm_mode = True


# ======================================================
# Transcript
# ======================================================

class TranscriptUpdate(BaseModel):
    transcript: str


class TranscriptResponse(BaseModel):
    success: bool = True
    video_id: int
    transcript: str


# ======================================================
# Summary
# ======================================================

class SummaryUpdate(BaseModel):
    summary: str


class SummaryResponse(BaseModel):
    success: bool = True
    video_id: int
    summary_type: str
    summary: str


# ======================================================
# Share Video
# ======================================================

class ShareVideoRequest(BaseModel):
    video_id: int
    learner_ids: List[int]


class ShareVideoResponse(BaseModel):
    success: bool = True
    message: str
    video_id: int
    learner_ids: List[int]


# ======================================================
# Engagement Analytics
# ======================================================

class EngagementResponse(BaseModel):
    total_videos: int
    total_views: int
    total_likes: int
    total_bookmarks: int


# ======================================================
# Classroom Analytics
# ======================================================

class ClassroomAnalyticsResponse(BaseModel):
    total_students: int
    total_videos: int
    active_students: int
    completed_students: int
    average_progress: float


# ======================================================
# Generic Success Response
# ======================================================

class MessageResponse(BaseModel):
    success: bool = True
    message: str