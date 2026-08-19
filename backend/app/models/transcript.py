from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from app.core.database import Base

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    text = Column(Text, nullable=False)
    segments = Column(JSON, nullable=True) # To store timestamps and text chunks
    keywords = Column(JSON, nullable=True) # Top keywords extracted from the transcript
