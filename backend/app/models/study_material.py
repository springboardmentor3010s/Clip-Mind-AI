from sqlalchemy import Column, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class StudyMaterial(Base):
    """Persisted, Educator-editable learning materials for a video — the
    'Create learning materials from transcripts' Educator feature. Starts as
    an auto-generated draft (flashcards/fill-in-the-blank/MCQs) and can be
    curated/edited by a Creator/Educator/Administrator before students see it."""
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), unique=True, nullable=False)

    flashcards = Column(JSON, default=list)
    fill_in_blanks = Column(JSON, default=list)
    mcqs = Column(JSON, default=list)

    created_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    video = relationship("Video")
    creator = relationship("User")
