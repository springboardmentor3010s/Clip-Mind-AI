"""
SummaryShare model.

Represents a shareable link an educator creates for a video summary so that
students/learners can view the summary without needing editor access.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base

class SummaryShare(Base):
    __tablename__ = "summary_shares"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Unique public token used in the share URL.
    token = Column(String(128), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    video = relationship("Video", back_populates="summary_shares")
    creator = relationship("User")

    def __repr__(self):
        return (
            f"<SummaryShare(id={self.id}, video_id={self.video_id}, "
            f"token='{self.token}', active={self.is_active})>"
        )