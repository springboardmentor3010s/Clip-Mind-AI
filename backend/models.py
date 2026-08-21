from sqlalchemy import Column, Integer, String, Text
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="learner")


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    filepath = Column(String)
    uploaded_by = Column(String)


class ProcessedVideo(Base):
    __tablename__ = "processed_videos"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String)
    filepath = Column(String)
    uploaded_by = Column(String)

    transcript = Column(Text)
    summary = Column(Text)
    key_moments = Column(Text)

    processing_time = Column(String)

    transcript_words = Column(Integer)
    summary_words = Column(Integer)
    compression_ratio = Column(String)