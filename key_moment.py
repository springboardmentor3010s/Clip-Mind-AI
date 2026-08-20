"""
SQLAlchemy model for storing AI-detected key moments (YouTube-style chapters).
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class KeyMoment(Base):
    __tablename__ = "key_moments"

    id = Column(Integer, primary_key=True)

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
    )

    start_time = Column(Float, nullable=False)

    end_time = Column(Float)

    title = Column(String(255))

    description = Column(Text)

    importance = Column(
        String(20),
        default="Medium",
        nullable=True,
        comment="Importance level: Low, Medium, High, Very High",
    )

    confidence = Column(Float)

    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship(
        "Video",
        back_populates="key_moments",
    )

    def __repr__(self):
        return (
            f"<KeyMoment(id={self.id}, "
            f"video_id={self.video_id}, "
            f"title='{self.title}', "
            f"importance='{self.importance}')>"
        )
