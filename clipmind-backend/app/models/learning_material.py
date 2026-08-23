from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    DateTime,
    JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class LearningMaterial(Base):

    __tablename__ = "learning_materials"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False,
        unique=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    overview = Column(
        Text,
        nullable=False
    )

    key_learning_points = Column(
        JSON,
        nullable=False
    )

    study_notes = Column(
        Text,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    video = relationship(
        "Video"
    )

    creator = relationship(
        "User"
    )