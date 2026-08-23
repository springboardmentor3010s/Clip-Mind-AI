from datetime import datetime
from typing import List

from pydantic import BaseModel


class LearningMaterialResponse(BaseModel):

    id: int
    video_id: int
    created_by: int

    overview: str
    key_learning_points: List[str]
    study_notes: str

    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class LearningMaterialShareCreate(BaseModel):

    learning_material_id: int
    classroom_id: int


class LearningMaterialShareResponse(BaseModel):

    id: int
    learning_material_id: int
    classroom_id: int
    shared_by: int
    shared_at: datetime

    class Config:
        from_attributes = True


class LearningMaterialLearnerResponse(BaseModel):

    id: int
    video_id: int
    video_filename: str

    classroom_id: int
    classroom_name: str

    overview: str
    key_learning_points: List[str]
    study_notes: str

    shared_at: datetime