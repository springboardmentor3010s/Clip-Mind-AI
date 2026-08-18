import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str):
    CONTENT_CREATOR = "CONTENT_CREATOR"
    LEARNER = "LEARNER"
    EDUCATOR = "EDUCATOR"
    ADMINISTRATOR = "ADMINISTRATOR"

class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="LEARNER")
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    videos = relationship("VideoModel", back_populates="uploader", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLogModel", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("BookmarkModel", back_populates="user", cascade="all, delete-orphan")

class VideoModel(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    duration = Column(Float, default=0.0)
    size = Column(Integer, default=0)
    status = Column(String, default="QUEUED")
    progress = Column(Integer, default=0)
    category = Column(String, default="General")
    views_count = Column(Integer, default=0)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    uploader_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    uploader = relationship("UserModel", back_populates="videos")

    transcript = relationship("TranscriptModel", back_populates="video", uselist=False, cascade="all, delete-orphan")
    summary = relationship("SummaryModel", back_populates="video", uselist=False, cascade="all, delete-orphan")
    key_moments = relationship("KeyMomentModel", back_populates="video", cascade="all, delete-orphan")
    bookmarks = relationship("BookmarkModel", back_populates="video", cascade="all, delete-orphan")

class TranscriptModel(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), unique=True, nullable=False)
    language = Column(String, default="en")
    full_text = Column(Text, nullable=False)
    segments_json = Column(Text, nullable=False) # JSON array of {id, start, end, text, confidence}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video = relationship("VideoModel", back_populates="transcript")

class SummaryModel(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), unique=True, nullable=False)
    short_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text, nullable=False)
    content_abstraction = Column(Text, nullable=False)
    bullet_points_json = Column(Text, nullable=False) # JSON list of key points
    reading_time_minutes = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    video = relationship("VideoModel", back_populates="summary")

class KeyMomentModel(Base):
    __tablename__ = "key_moments"

    id = Column(String, primary_key=True, default=generate_uuid)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    importance_score = Column(Integer, default=80)
    topic = Column(String, nullable=False)
    keywords_json = Column(Text, nullable=False) # JSON list of keyword strings

    video = relationship("VideoModel", back_populates="key_moments")

class ActivityLogModel(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserModel", back_populates="activity_logs")

class BookmarkModel(Base):
    __tablename__ = "bookmarks"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, default="HIGHLIGHT") # SUMMARY, HIGHLIGHT, TRANSCRIPT
    content_snippet = Column(Text, nullable=False)
    timestamp_sec = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("UserModel", back_populates="bookmarks")
    video = relationship("VideoModel", back_populates="bookmarks")

class ClassroomModel(Base):
    __tablename__ = "classrooms"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    class_code = Column(String, unique=True, index=True, nullable=False)
    educator_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow
    )

    educator = relationship("UserModel", foreign_keys=[educator_id])
    members = relationship(
        "ClassroomMemberModel",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )
    videos = relationship(
        "ClassroomVideoModel",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )
    assignments = relationship(
        "AssignmentModel",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )


class ClassroomMemberModel(Base):
    __tablename__ = "classroom_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    classroom_id = Column(
        String,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )
    learner_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship(
        "ClassroomModel",
        back_populates="members"
    )
    learner = relationship("UserModel")


class ClassroomVideoModel(Base):
    __tablename__ = "classroom_videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    classroom_id = Column(
        String,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )
    video_id = Column(
        String,
        ForeignKey("videos.id", ondelete="CASCADE"),
        nullable=False
    )
    shared_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship(
        "ClassroomModel",
        back_populates="videos"
    )
    video = relationship("VideoModel")


class AssignmentModel(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=generate_uuid)
    classroom_id = Column(
        String,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )
    video_id = Column(
        String,
        ForeignKey("videos.id", ondelete="SET NULL"),
        nullable=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship(
        "ClassroomModel",
        back_populates="assignments"
    )
    video = relationship("VideoModel")
