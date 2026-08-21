from pydantic import BaseModel


class ShareRequest(BaseModel):
    educator_id: int
    learner_id: int
    video_id: int


class ShareResponse(BaseModel):
    success: bool
    message: str