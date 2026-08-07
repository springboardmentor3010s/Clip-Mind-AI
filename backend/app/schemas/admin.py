"""
Pydantic schemas for admin-only platform stats and content moderation.
"""
from pydantic import BaseModel


class PlatformStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    users_by_role: dict[str, int]

    total_videos: int
    published_videos: int
    videos_by_status: dict[str, int]

    total_storage_mb: float
    avg_video_size_mb: float

    total_transcripts: int
    total_summaries: int
    total_key_moments: int