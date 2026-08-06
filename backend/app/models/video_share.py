"""
VideoShare model — supports targeted sharing of a video with specific
people, distinct from the "Public" content library (Video.is_published).
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class VideoShare(Base):
    __tablename__ = "video_shares"
    __table_args__ = (UniqueConstraint("video_id", "shared_with_user_id", name="uq_video_share_recipient"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id"), nullable=False, index=True)
    shared_with_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    shared_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<VideoShare video_id={self.video_id} shared_with_user_id={self.shared_with_user_id}>"