"""
ClassroomVideoShare model — shares a video with an entire Classroom in
one row, rather than fanning out to one VideoShare row per student.
Access is resolved dynamically at read time via ClassroomMembership, so
a student who joins the classroom after the share was created still
gets access — and one who leaves loses it — without touching this table.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ClassroomVideoShare(Base):
    __tablename__ = "classroom_video_shares"
    __table_args__ = (UniqueConstraint("video_id", "classroom_id", name="uq_classroom_video_share"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id"), nullable=False, index=True)
    classroom_id = Column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False, index=True)
    shared_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<ClassroomVideoShare video_id={self.video_id} classroom_id={self.classroom_id}>"