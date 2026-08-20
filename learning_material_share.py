"""
Learning material share schemas (Pydantic models).

Represents a shareable link an educator creates for a learning material
(study notes) so that students/learners can view the notes without needing
editor access.
"""
from datetime import datetime

from pydantic import BaseModel

from app.schemas.learning_material import LearningMaterialContent

class LearningMaterialShareRead(BaseModel):
    """Response schema for a learning material share link (owner-facing)."""
    id: int
    material_id: int
    token: str
    is_active: bool
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SharedLearningMaterialView(BaseModel):
    """Public payload returned when a student opens a learning material share link."""
    video_id: int
    video_title: str
    educator_name: str
    material_id: int
    title: str
    content: LearningMaterialContent
    shared_at: datetime