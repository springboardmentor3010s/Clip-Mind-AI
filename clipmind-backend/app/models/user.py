from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.base import Base
from app.core.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    full_name = Column(
        String,
        nullable=False
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    hashed_password = Column(
        String,
        nullable=False
    )

    role = Column(
        Enum(UserRole),
        nullable=False,
        default=UserRole.LEARNER
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    videos = relationship(
        "Video",
        back_populates="owner"
    )

    activities = relationship(
        "ActivityHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    bookmarks = relationship(
    "Bookmark",
    back_populates="user",
    cascade="all, delete-orphan",
    )

    classrooms = relationship(
        "Classroom",
        back_populates="educator",
        cascade="all, delete-orphan"
    )

    classroom_memberships = relationship(
    "ClassroomMember",
    back_populates="learner",
    cascade="all, delete-orphan"
)