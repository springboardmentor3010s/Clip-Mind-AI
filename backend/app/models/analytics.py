from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.core.types import GUID

class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    
    event_type = Column(String, index=True) # e.g., "video_view", "summary_read", "export_txt", "processing_time"
    metadata_val = Column(String, nullable=True) # Any extra info (e.g., duration played, or processing seconds)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video")
    user = relationship("User")
