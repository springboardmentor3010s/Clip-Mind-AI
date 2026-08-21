from pydantic import BaseModel
from datetime import datetime


class VideoResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    file_path: str
    file_size: int
    file_type: str
    uploaded_by: int
    uploaded_at: datetime
    status: str

    class Config:
        from_attributes = True