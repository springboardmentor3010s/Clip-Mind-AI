from pydantic import BaseModel
from datetime import datetime


class TranscriptResponse(BaseModel):
    id: int
    video_id: int
    language: str
    transcript_text: str
    transcript_file_path: str | None
    created_at: datetime

    class Config:
        from_attributes = True