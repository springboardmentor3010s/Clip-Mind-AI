from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TranscriptSegmentUpdate(BaseModel):
    id: str
    text: str

class TranscriptUpdate(BaseModel):
    segments: List[TranscriptSegmentUpdate]

class TranscriptResponse(BaseModel):
    id: int
    video_id: int
    text: str
    segments: List[Dict[str, Any]]
    keywords: Optional[List[str]] = None

    class Config:
        from_attributes = True
