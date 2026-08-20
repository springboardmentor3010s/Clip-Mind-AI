"""
Pydantic schemas for classroom-scoped analytics — the PRD's "classroom
content analytics" and "student engagement metrics" features, which had
nowhere to attach to before the Classroom module existed.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel


class ClassroomVideoEngagement(BaseModel):
    video_id: uuid.UUID
    title: str
    shared_at: datetime
    students_watched: int          # how many enrolled students have watched any of it
    student_count: int             # classroom size at query time, for computing the rate below
    watch_rate_pct: float          # students_watched / student_count
    avg_completion_pct: float      # averaged only over students who started watching
    avg_watch_time_seconds: float  # averaged only over students who started watching


class ClassroomStudentEngagement(BaseModel):
    student_id: uuid.UUID
    full_name: str
    videos_watched: int            # of the videos shared with this classroom, how many they started
    videos_assigned: int           # total videos currently shared with this classroom
    avg_completion_pct: float      # averaged over videos they actually started
    total_watch_time_seconds: float
    last_active_at: datetime | None = None


class ClassroomAnalytics(BaseModel):
    classroom_id: uuid.UUID
    classroom_name: str
    student_count: int
    video_count: int
    avg_completion_pct: float      # class-wide average, across all (video, student) pairs with any watch time
    videos: list[ClassroomVideoEngagement]
    students: list[ClassroomStudentEngagement]
    generated_at: datetime