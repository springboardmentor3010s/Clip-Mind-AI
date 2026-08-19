from typing import List, Dict, Any
from pydantic import BaseModel


class StudyMaterialsResponse(BaseModel):
    flashcards: List[Dict[str, Any]] = []
    fill_in_blanks: List[Dict[str, Any]] = []
    mcqs: List[Dict[str, Any]] = []
    is_saved: bool = False  # false = ephemeral draft, never persisted/edited yet


class StudyMaterialsUpdate(BaseModel):
    flashcards: List[Dict[str, Any]] = []
    fill_in_blanks: List[Dict[str, Any]] = []
    mcqs: List[Dict[str, Any]] = []
