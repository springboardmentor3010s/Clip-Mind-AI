"""
LearningMaterialShare model.

Represents a shareable link an educator creates for a learning material
(study notes) so that students/learners can view the notes without needing
editor access.
"""
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    func,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database.database import Base

class LearningMaterialShare(Base):
    __tablename__ = "learning_material_shares"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(
        Integer,
        ForeignKey("learning_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Unique public token used in the share URL.
    token = Column(String(128), unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    material = relationship("LearningMaterial", back_populates="shares")
    creator = relationship("User")

    def __repr__(self):
        return (
            f"<LearningMaterialShare(id={self.id}, material_id={self.material_id}, "
            f"token='{self.token}', active={self.is_active})>"
        )