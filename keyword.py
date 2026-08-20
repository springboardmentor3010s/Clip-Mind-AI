"""
SQLAlchemy model for storing extracted transcript keywords.
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True)

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False,
    )

    keyword = Column(String(255), nullable=False, index=True)

    count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship(
        "Video",
        back_populates="keywords",
    )

    def __repr__(self):
        return (
            f"<Keyword(id={self.id}, "
            f"video_id={self.video_id}, "
            f"keyword='{self.keyword}', "
            f"count={self.count})>"
        )