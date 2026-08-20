"""
Analytics model.
"""
from sqlalchemy import Column, Integer, DateTime, func, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.database.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False, unique=True)
    views = Column(Integer, default=0, nullable=False)
    watch_time = Column(Float, default=0.0, nullable=False)
    unique_viewers = Column(Integer, default=0, nullable=False)
    total_watch_time = Column(Float, default=0.0, nullable=False)
    completion_rate = Column(Float, default=0.0, nullable=False)
    avg_watch_duration = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship
    video = relationship("Video", back_populates="analytics")

    def __repr__(self):
        return f"<Analytics(id={self.id}, video_id={self.video_id})>"
