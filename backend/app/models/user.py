from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    # ==========================================
    # Primary Key
    # ==========================================

    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # User Details
    # ==========================================

    full_name = Column(String(100), nullable=False)

    email = Column(String(150), unique=True, nullable=False)

    password_hash = Column(String, nullable=False)

    role_id = Column(Integer, ForeignKey("roles.id"))

    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # ==========================================
    # Relationships
    # ==========================================

    role = relationship(
        "Role",
        back_populates="users"
    )

    activities = relationship(
        "ActivityLog",
        back_populates="user"
    )

    videos = relationship(
        "Video",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    bookmarks = relationship(
        "Bookmark",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    learning_history = relationship(
        "LearningHistory",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # ==========================================
    # Materials Uploaded
    # ==========================================

    materials = relationship(
        "Material",
        back_populates="educator",
        cascade="all, delete-orphan"
    )

    # ==========================================
    # Shared Videos
    # ==========================================

    shared_videos_sent = relationship(
        "SharedVideo",
        foreign_keys="SharedVideo.educator_id",
        cascade="all, delete-orphan"
    )

    shared_videos_received = relationship(
        "SharedVideo",
        foreign_keys="SharedVideo.learner_id",
        cascade="all, delete-orphan"
    )