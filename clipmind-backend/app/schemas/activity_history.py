from datetime import datetime

from pydantic import BaseModel

from app.core.enums import ActivityType


class ActivityHistoryResponse(BaseModel):
    id: int
    activity_type: ActivityType
    description: str
    created_at: datetime

    class Config:
        from_attributes = True