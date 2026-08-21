from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Bookmark(Base):
    __tablename__ = "bookmarks"

    # ==========================================
    # Primary Key
    # ==========================================
    id = Column(Integer, primary_key=True, index=True)

    # ==========================================
    # Foreign Keys
    # ==========================================
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    video_id = Column(
        Integer,
        ForeignKey("videos.id"),
        nullable=False
    )

    # ==========================================
    # Timestamp
    # ==========================================
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # ==========================================
    # Relationships
    # ==========================================
    user = relationship(
        "User",
        back_populates="bookmarks"
    )

    video = relationship(
        "Video"
    )

    # ==========================================
    # Response
    # ==========================================
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "video_id": self.video_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }