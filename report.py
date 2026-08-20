"""
Report schemas (Pydantic models).
"""
from pydantic import BaseModel

class ReportResponse(BaseModel):
    """Schema for report download response metadata."""
    filename: str
    message: str
