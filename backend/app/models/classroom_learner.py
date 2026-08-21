from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class ClassroomLearner(Base):
    __tablename__ = "classroom_learners"

    id = Column(Integer, primary_key=True, index=True)

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id", ondelete="CASCADE"),
        nullable=False
    )

    learner_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    classroom = relationship(
        "Classroom",
        back_populates="learners"
    )

    learner = relationship(
        "User"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "classroom_id": self.classroom_id,
            "learner_id": self.learner_id
        }