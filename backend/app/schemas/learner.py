from pydantic import BaseModel
from datetime import datetime
from typing import List


class VideoResponse(BaseModel):
    id: int
    title: str
    thumbnail: str | None = None
    duration: float | None = None
    status: str
    created_at: datetime | None = None


class SummaryResponse(BaseModel):
    video_id: int
    summary: str | None = None


class TranscriptResponse(BaseModel):
    video_id: int
    transcript: str | None = None


class KeyMomentsResponse(BaseModel):
    video_id: int
    key_moments: List = []