from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.base import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    educator_id = Column(
        Integer,
        ForeignKey("users.id"),
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

    educator = relationship(
        "User",
        back_populates="classrooms"
    )

    memberships = relationship(
    "ClassroomMember",
    back_populates="classroom",
    cascade="all, delete-orphan"
    )

    videos = relationship(
    "Video",
    back_populates="classroom"
)