from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Type of content being bookmarked
    # Example: SUMMARY or HIGHLIGHT
    content_type = Column(
        String,
        nullable=False,
        index=True
    )

    # ID of the bookmarked content
    content_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="bookmarks"
    )