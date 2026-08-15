from datetime import datetime
from pydantic import BaseModel


class KeyMomentResponse(BaseModel):
    id: int
    video_id: int
    transcript_segment_id: int
    start_time: float
    end_time: float
    title: str
    segment_text: str
    importance_score: float
    created_at: datetime

    class Config:
        from_attributes = True