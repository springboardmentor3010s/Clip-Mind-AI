from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class VideoResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_by: str

    class Config:
        from_attributes = True