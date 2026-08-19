from pydantic import BaseModel
from typing import List, Optional
from app.models.video import VideoStatus
from datetime import datetime

class VideoCreate(BaseModel):
    title: str
    filename: str
    file_type: str
    file_size_bytes: Optional[int] = None
    
class MultipartUploadInitResponse(BaseModel):
    video_id: int
    upload_id: str
    s3_key: str

class MultipartUploadPartRequest(BaseModel):
    upload_id: str
    s3_key: str
    part_numbers: List[int]
    
class MultipartUploadPartResponse(BaseModel):
    presigned_urls: dict # part_number -> presigned_url

class MultipartUploadCompletePart(BaseModel):
    ETag: str
    PartNumber: int

class MultipartUploadCompleteRequest(BaseModel):
    video_id: int
    upload_id: str
    s3_key: str
    parts: List[MultipartUploadCompletePart]

class VideoUpdate(BaseModel):
    title: str

class VideoResponse(BaseModel):
    id: int
    title: str
    filename: str
    status: VideoStatus
    duration_seconds: int = 0
    file_size_bytes: int = 0
    url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

