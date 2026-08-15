from pydantic import BaseModel
from datetime import datetime


class KeywordResponse(BaseModel):
    id: int
    video_id: int
    keyword: str
    frequency: int
    relevance_score: float
    created_at: datetime

    class Config:
        from_attributes = True