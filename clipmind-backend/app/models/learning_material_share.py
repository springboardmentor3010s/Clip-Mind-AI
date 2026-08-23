from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    UniqueConstraint
)
from sqlalchemy.sql import func

from app.database.base import Base


class LearningMaterialShare(Base):

    __tablename__ = "learning_material_shares"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    learning_material_id = Column(
        Integer,
        ForeignKey("learning_materials.id"),
        nullable=False
    )

    classroom_id = Column(
        Integer,
        ForeignKey("classrooms.id"),
        nullable=False
    )

    shared_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    shared_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "learning_material_id",
            "classroom_id",
            name="uq_learning_material_classroom"
        ),
    )