from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
)

from app.database.base import Base


class Bookmark(Base):

    __tablename__ = "bookmarks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    learner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False,
        index=True
    )

    bookmark_type = Column(
        String(30),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=True
    )

    content = Column(
        Text,
        nullable=True
    )

    timestamp = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )