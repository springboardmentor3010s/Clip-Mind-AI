from pydantic import BaseModel, Field
from datetime import datetime


class ClassroomCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        max_length=1000
    )


class ClassroomResponse(BaseModel):
    id: int
    name: str
    description: str | None
    educator_id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True

class ClassroomMemberCreate(BaseModel):
    learner_identifier: str = Field(
        ...,
        min_length=1
    )


class ClassroomMemberResponse(BaseModel):
    id: int
    learner_id: int
    username: str
    full_name: str
    email: str
    joined_at: datetime