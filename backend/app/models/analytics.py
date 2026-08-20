"""
analytics_events table — extended to support activity history
even after the related video is deleted.
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.postgres import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    video_id = Column(UUID(as_uuid=True), nullable=True)  # no FK constraint — video may later be deleted
    video_title = Column(String(255), nullable=True)      # snapshot of the title at event time
    event_type = Column(String(50), nullable=False)
    event_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    metadata_json = Column("metadata", JSONB, nullable=True)

    def __repr__(self):
        return f"<AnalyticsEvent {self.event_type}>"