from pydantic import BaseModel
from typing import Optional


class SummaryResponse(BaseModel):
    success: bool
    video_id: int
    summary: str


class SummaryGenerateResponse(BaseModel):
    message: str
    video_id: int
    summary: str


class SummaryError(BaseModel):
    detail: str