"""
Bookmark model.

Represents a user's saved/bookmarked video (save-for-later functionality).
"""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id", "video_id",
            name="uq_bookmark_user_video"
        ),
    )

    user = relationship("User", back_populates="bookmarks")
    video = relationship("Video", back_populates="bookmarks")
