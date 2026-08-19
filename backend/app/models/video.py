from sqlalchemy import Column, Integer, String, DateTime, Enum
import enum
from datetime import datetime
from app.core.database import Base

class VideoStatus(str, enum.Enum):
    PENDING = "PENDING"
    UPLOADING = "UPLOADING"
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    filename = Column(String)
    s3_key = Column(String, unique=True, index=True)
    upload_id = Column(String, nullable=True) # For multipart upload tracking
    status = Column(Enum(VideoStatus), default=VideoStatus.PENDING)
    duration_seconds = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
