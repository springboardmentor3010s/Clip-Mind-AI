from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class SharedVideo(Base):
    __tablename__ = "shared_videos"

    # ==========================================
    # Primary Key
    # ==========================================

    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # Foreign Keys
    # ==========================================

    video_id = Column(
        Integer,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False
    )

    educator_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    learner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # ==========================================
    # Shared Time
    # ==========================================

    shared_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # ==========================================
    # Relationships
    # ==========================================

    video = relationship(
        "Video",
        back_populates="shared_videos"
    )

    educator = relationship(
        "User",
        foreign_keys=[educator_id]
    )

    learner = relationship(
        "User",
        foreign_keys=[learner_id]
    )

    # ==========================================
    # Convert to Dictionary
    # ==========================================

    def to_dict(self):
        return {
            "id": self.id,
            "video_id": self.video_id,
            "educator_id": self.educator_id,
            "learner_id": self.learner_id,
            "shared_at": self.shared_at.isoformat() if self.shared_at else None
        }