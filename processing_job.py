"""
ProcessingJob model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    job_type = Column(String(50), nullable=False)
    status = Column(String(50), default="pending", nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationship
    video = relationship("Video", back_populates="processing_jobs")

    def __repr__(self):
        return f"<ProcessingJob(id={self.id}, video_id={self.video_id}, status='{self.status}')>"
