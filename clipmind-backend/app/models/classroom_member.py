from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    UniqueConstraint
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

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
        DateTime(timezone=True),
        server_default=func.now()
    )

    __table_args__ = (
        UniqueConstraint(
            "classroom_id",
            "learner_id",
            name="uq_classroom_learner"
        ),
    )

    classroom = relationship(
        "Classroom",
        back_populates="memberships"
    )

    learner = relationship(
        "User",
        back_populates="classroom_memberships"
    )