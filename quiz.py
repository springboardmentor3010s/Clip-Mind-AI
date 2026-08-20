"""
Quiz schemas for request/response validation.
"""

from pydantic import BaseModel, Field

class QuizGenerateRequest(BaseModel):
    """Request body for generating a quiz."""

    transcript: str = Field(..., description="The transcript or summary text")
    count: int = Field(default=10, ge=1, le=20, description="Number of questions")
    difficulty: str = Field(
        default="Medium",
        pattern="^(Easy|Medium|Hard)$",
        description="Difficulty level",
    )


class QuizQuestion(BaseModel):
    """A single quiz question."""

    question: str
    options: list[str]
    answer: str


class QuizGenerateResponse(BaseModel):
    """Response containing generated quiz questions."""

    questions: list[QuizQuestion]
    total: int