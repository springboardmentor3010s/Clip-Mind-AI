from pydantic import BaseModel
from datetime import datetime


class TranscriptSegmentResponse(BaseModel):
    id: int
    transcript_id: int
    video_id: int
    segment_index: int
    start_time: float
    end_time: float
    segment_text: str
    is_edited: bool
    created_at: datetime

    class Config:
        from_attributes = True