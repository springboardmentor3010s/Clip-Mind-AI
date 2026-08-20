from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)

from app.database.base import Base


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

    learner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    joined_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint(
            "classroom_id",
            "learner_id",
            name="unique_classroom_learner"
        ),
    )