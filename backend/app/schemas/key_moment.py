from pydantic import BaseModel
from typing import List, Optional

class KeyMomentBase(BaseModel):
    start_time: int
    end_time: int
    title: str
    description: Optional[str] = None

class KeyMomentCreate(KeyMomentBase):
    video_id: int

class KeyMomentResponse(KeyMomentBase):
    id: int
    video_id: int

    class Config:
        from_attributes = True

class KeyMomentGenerateRequest(BaseModel):
    video_id: int
    # Optionally, we can pass segments from the client if the backend doesn't store them yet
    # Or rely on the Transcript model in the DB
