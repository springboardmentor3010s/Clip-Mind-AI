from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.core.database import Base

class KeyMoment(Base):
    __tablename__ = "key_moments"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    start_time = Column(Integer, nullable=False)
    end_time = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
