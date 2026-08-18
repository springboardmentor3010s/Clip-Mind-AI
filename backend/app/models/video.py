from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class VideoMetadata(Base):
    __tablename__ = "video_metadata"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    status = Column(String(50), default="PROCESSING") # PROCESSING, COMPLETED, FAILED
    
    # Existing AI fields
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Milestone 3 Additions
    key_moments = Column(JSON, nullable=True)  # List of {start, end, title, summary, score}
    keywords = Column(JSON, nullable=True)     # List of top extracted tags/topics
    analytics_data = Column(JSON, nullable=True) # Metrics like sentiment, readability, length
    
    created_at = Column(DateTime, default=datetime.utcnow)