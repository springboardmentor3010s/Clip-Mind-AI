from sqlalchemy import Column, Integer, Text, ForeignKey
from app.core.database import Base

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    short_summary = Column(Text, nullable=True)
    detailed_summary = Column(Text, nullable=True)
