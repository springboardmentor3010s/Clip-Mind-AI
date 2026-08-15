from pydantic import BaseModel


class TranscriptInfo(BaseModel):
    id: int

    class Config:
        from_attributes = True


class SummaryInfo(BaseModel):
    id: int
    summary_type: str

    class Config:
        from_attributes = True


class VideoResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    status: str

    transcript: TranscriptInfo | None = None
    summaries: list[SummaryInfo] = []

    class Config:
        from_attributes = True