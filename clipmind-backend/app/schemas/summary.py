from datetime import datetime
from pydantic import BaseModel


class SummaryResponse(BaseModel):
    id: int
    video_id: int
    summary_type: str
    summary_text: str
    model_name: str
    processing_time: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True