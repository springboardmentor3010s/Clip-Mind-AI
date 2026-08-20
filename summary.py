"""
Summary model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.database.database import Base

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, unique=True)
    short_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text, nullable=False)
    model_used = Column(String(100), nullable=True)
    bullet_points = Column(JSON, nullable=True)  # List[str] of key bullet points
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    video = relationship("Video", back_populates="summary")

    def __repr__(self):
        return f"<Summary(id={self.id}, video_id={self.video_id})>"
