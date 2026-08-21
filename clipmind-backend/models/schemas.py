from typing import List, Optional

from pydantic import BaseModel


class VideoIdBody(BaseModel):
    videoId: str


class TranscriptSegmentOut(BaseModel):
    id: str
    seconds: float
    time: str
    speaker: str
    text: str


class KeyMomentOut(BaseModel):
    id: str
    seconds: float
    time: str
    title: str
    description: str
    confidence: float
    tag: str


class SummaryOut(BaseModel):
    shortSummary: str
    abstract: str
    detailedSummary: str
    bullets: List[str]
    topics: List[str]
    actionItems: List[str]
    wordCount: int
    compression: int


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str
    role: str
    institution: Optional[str] = None


class LoginBody(BaseModel):
    email: str
    password: str


class ForgotPasswordBody(BaseModel):
    email: str


class UpdateProfileBody(BaseModel):
    name: str
    institution: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: dict