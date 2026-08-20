"""
Response schema for key moment detection endpoint.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DetectKeyMomentResponse(BaseModel):
    """Schema for the /detect endpoint response."""

    message: str
    keywords: List[Dict[str, Any]] = []
    total_detected: int = 0
    key_moments: Optional[List[Dict[str, Any]]] = None

