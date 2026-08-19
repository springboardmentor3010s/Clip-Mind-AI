from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.core.types import GUID


class Classroom(Base):
    """An Educator's classroom — groups students and assigned videos so
    content 'doesn't get here and there and confused' across cohorts."""
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    educator_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    educator = relationship("User")


class ClassroomMembership(Base):
    """A Learner enrolled in a classroom."""
    __tablename__ = "classroom_memberships"
    __table_args__ = (UniqueConstraint("classroom_id", "student_id", name="uq_classroom_student"),)

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom")
    student = relationship("User")


class ClassroomVideo(Base):
    """A video assigned to a classroom."""
    __tablename__ = "classroom_videos"
    __table_args__ = (UniqueConstraint("classroom_id", "video_id", name="uq_classroom_video"),)

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    classroom = relationship("Classroom")
    video = relationship("Video")
