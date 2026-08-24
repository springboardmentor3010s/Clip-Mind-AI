from typing import List

from pydantic import BaseModel


class ClassroomAnalyticsItem(BaseModel):

    classroom_id: int
    classroom_name: str

    learner_count: int
    video_count: int

    summary_share_count: int
    learning_material_share_count: int


class ClassroomAnalyticsResponse(BaseModel):

    total_classrooms: int
    total_learners: int
    total_videos: int

    total_summary_shares: int
    total_learning_material_shares: int

    classrooms: List[ClassroomAnalyticsItem]