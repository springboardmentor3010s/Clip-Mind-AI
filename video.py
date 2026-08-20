"""
Video model.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, func, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship

from app.database.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    duration = Column(Float, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    audio_path = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    status = Column(String(50), default="uploaded", nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="videos")
    transcript = relationship("Transcript", back_populates="video", uselist=False, cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="video", uselist=False, cascade="all, delete-orphan")
    key_moments = relationship("KeyMoment", back_populates="video", cascade="all, delete-orphan")
    keywords = relationship("Keyword", back_populates="video", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="video", uselist=False, cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="video", cascade="all, delete-orphan")
    watch_history = relationship("WatchHistory", back_populates="video", cascade="all, delete-orphan")
    processing_jobs = relationship("ProcessingJob", back_populates="video", cascade="all, delete-orphan")
    summary_shares = relationship("SummaryShare", back_populates="video", cascade="all, delete-orphan")
    learning_materials = relationship("LearningMaterial", back_populates="video", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Video(id={self.id}, title='{self.title}')>"
