"""
LearningMaterial model.

Represents study material that an educator creates from a video transcript
(e.g. key terms, flashcards, and key takeaways) to help students learn.
"""
from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

from app.database.database import Base

class LearningMaterial(Base):
    __tablename__ = "learning_materials"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False)
    # JSON blob: { summary, key_terms[], flashcards[], takeaways[] }
    content = Column(JSON, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    video = relationship("Video", back_populates="learning_materials")
    creator = relationship("User")
    shares = relationship(
        "LearningMaterialShare",
        back_populates="material",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return (
            f"<LearningMaterial(id={self.id}, video_id={self.video_id}, "
            f"title='{self.title}')>"
        )