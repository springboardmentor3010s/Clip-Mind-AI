from pydantic import BaseModel


class VideoResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    status: str

    class Config:
        from_attributes = True

class TranscriptResponse(BaseModel):
    id: int
    transcript: str | None

    class Config:
        from_attributes = True

class SummaryResponse(BaseModel):
    summary: str

    class Config:
        from_attributes = True