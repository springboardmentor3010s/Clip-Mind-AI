from pydantic import BaseModel
from typing import Optional

class SummaryCreate(BaseModel):
    video_id: int
    text: str
    
class SummaryResponse(BaseModel):
    id: int
    video_id: int
    short_summary: Optional[str] = None
    detailed_summary: Optional[str] = None

    class Config:
        from_attributes = True
