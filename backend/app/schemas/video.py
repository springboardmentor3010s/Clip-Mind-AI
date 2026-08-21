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
    summary: str | None
    short_summary: str | None

    class Config:
        from_attributes = True

class KeyMomentsResponse(BaseModel):
    key_moments: list

    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    video_name: str
    status: str
    transcript_word_count: int
    summary_word_count: int
    summary: str
    key_moments: list
    keywords: list
    topics: list

    class Config:
        from_attributes = True

class KeywordsResponse(BaseModel):
    keywords: list

    class Config:
        from_attributes = True

class TopicsResponse(BaseModel):
    topics: list

    class Config:
        from_attributes = True

class HighlightReport(BaseModel):
    executive_summary: str
    top_highlights: list[str]
    important_keywords: list[str]
    key_moments: list[str]
    ai_insight: str


class HighlightReportResponse(BaseModel):
    highlight_report: HighlightReport
    