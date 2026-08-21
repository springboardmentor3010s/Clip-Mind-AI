from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    code = Column(
        String(20),
        unique=True,
        nullable=False,
        index=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    creator = relationship(
        "User",
        foreign_keys=[created_by]
    )

    members = relationship(
        "ClassroomMember",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )

    videos = relationship(
        "Video",
        back_populates="classroom"
    )

    # Summary shares belong to a classroom
    summary_shares = relationship(
        "SummaryShare",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )


class ClassroomMember(Base):
    __tablename__ = "classroom_members"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=False
    )

    student_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    classroom = relationship(
        "Classroom",
        back_populates="members"
    )

    student = relationship(
        "User",
        foreign_keys=[student_id]
    )