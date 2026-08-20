from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)

from app.database.base import Base


class ClassroomPost(Base):

    __tablename__ = "classroom_posts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    content = Column(
        Text,
        nullable=True
    )

    post_type = Column(
        String(50),
        default="announcement"
    )

    file_path = Column(
        String(500),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    
    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=True
    )