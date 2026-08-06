from pydantic import BaseModel


class VideoResponse(BaseModel):

    id: int
    title: str
    description: str | None = None
    category: str | None = None
    filename: str
    status: str

    class Config:
        from_attributes = True