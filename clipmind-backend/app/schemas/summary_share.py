from pydantic import BaseModel
from datetime import datetime


class SummaryShareCreate(BaseModel):
    summary_id: int
    classroom_id: int


class SummaryShareResponse(BaseModel):
    id: int
    summary_id: int
    classroom_id: int
    shared_by: int
    shared_at: datetime

    class Config:
        from_attributes = True