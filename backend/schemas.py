from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class VideoResponse(BaseModel):
    id: int
    filename: str
    filepath: str
    uploaded_by: str

    class Config:
        from_attributes = True