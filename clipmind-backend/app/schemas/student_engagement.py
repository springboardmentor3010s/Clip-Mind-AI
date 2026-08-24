from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class StudentEngagementItem(BaseModel):

    learner_id: int

    full_name: str

    username: str

    total_actions: int

    summary_views: int

    transcript_views: int

    transcript_segment_views: int

    key_moment_views: int

    highlight_views: int

    bookmarks_added: int

    last_active_at: Optional[datetime] = None

    engagement_status: str


class StudentEngagementResponse(BaseModel):

    total_learners: int

    active_learners: int

    inactive_learners: int

    total_engagement_actions: int

    summary_views: int

    transcript_views: int

    transcript_segment_views: int

    key_moment_views: int

    highlight_views: int

    bookmarks_added: int

    average_actions_per_active_learner: float

    students: List[StudentEngagementItem]