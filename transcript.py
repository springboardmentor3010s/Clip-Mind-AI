"""
Transcript model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship

from app.database.database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, unique=True)
    transcript = Column(Text, nullable=False)
    language = Column(String(20), default="en", nullable=False)
    confidence = Column(Integer, nullable=True)
    segments = Column(JSON, nullable=True)  # Whisper segments: [{id, start, end, text}, ...]
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    video = relationship("Video", back_populates="transcript")

    def __repr__(self):
        return f"<Transcript(id={self.id}, video_id={self.video_id})>"
