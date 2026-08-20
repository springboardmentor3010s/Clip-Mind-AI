"""
Learning material router: endpoints for creating and managing study materials
(key terms, flashcards, takeaways) generated from a video transcript.
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.learning_material import LearningMaterial
from app.models.video import Video
from app.schemas.learning_material import (
    LearningMaterialCreate,
    LearningMaterialRead,
    LearningMaterialUpdate,
)
from app.services.learning_material_service import LearningMaterialService
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/api/videos/{video_id}/learning-materials",
    tags=["Learning Materials"],
)


def _get_video_for_read(db: Session, video_id: int, current_user) -> Video:
    """Fetch a video and verify read access (published OR owned by the user)."""
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if not VideoService.is_accessible(video, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )
    return video


def _get_video_or_404(db: Session, video_id: int, current_user) -> Video:
    """Fetch a video and verify ownership. Raises HTTPException otherwise."""
    video = VideoService.get_video_by_id(db, video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )
    if video.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this video",
        )
    return video


def _get_material_or_404(db: Session, video_id: int, material_id: int) -> LearningMaterial:
    material = (
        db.query(LearningMaterial)
        .filter(
            LearningMaterial.id == material_id,
            LearningMaterial.video_id == video_id,
        )
        .first()
    )
    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning material not found",
        )
    return material


# ---------------------------------------------------------
# List learning materials
# ---------------------------------------------------------

@router.get("/", response_model=List[LearningMaterialRead])
def list_learning_materials(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all learning materials for a video (published OR owned by the user)."""
    _get_video_for_read(db, video_id, current_user)
    materials = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.video_id == video_id)
        .order_by(LearningMaterial.created_at.desc())
        .all()
    )
    return materials


# ---------------------------------------------------------
# Generate learning materials with AI (from the transcript)
# ---------------------------------------------------------

@router.post("/generate", response_model=LearningMaterialRead)
def generate_learning_material(
    video_id: int,
    title: str = "Study Notes",
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate a complete set of study materials (summary, key terms,
    flashcards, takeaways) from the video's transcript.

    Requires ownership of the video.
    """
    video = _get_video_or_404(db, video_id, current_user)

    if video.transcript is None or not video.transcript.transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript not found. Generate a transcript first.",
        )

    summary_text = None
    if video.summary is not None:
        summary_text = video.summary.detailed_summary or video.summary.short_summary

    try:
        content = LearningMaterialService.generate(
            transcript=video.transcript.transcript,
            summary_text=summary_text,
            title_hint=title,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    material = LearningMaterial(
        video_id=video_id,
        title=title,
        content=content,
        created_by=current_user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


# ---------------------------------------------------------
# Create a learning material with custom content
# ---------------------------------------------------------

@router.post("/", response_model=LearningMaterialRead, status_code=status.HTTP_201_CREATED)
def create_learning_material(
    video_id: int,
    payload: LearningMaterialCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a learning material with educator-supplied content (owner only)."""
    _get_video_or_404(db, video_id, current_user)

    material = LearningMaterial(
        video_id=video_id,
        title=payload.title,
        content=payload.content.model_dump(),
        created_by=current_user.id,
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


# ---------------------------------------------------------
# Update a learning material
# ---------------------------------------------------------

@router.put("/{material_id}", response_model=LearningMaterialRead)
def update_learning_material(
    video_id: int,
    material_id: int,
    payload: LearningMaterialUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a learning material's title and/or content (owner only)."""
    _get_video_or_404(db, video_id, current_user)
    material = _get_material_or_404(db, video_id, material_id)

    if payload.title is not None:
        material.title = payload.title
    if payload.content is not None:
        material.content = payload.content.model_dump()

    db.add(material)
    db.commit()
    db.refresh(material)
    return material


# ---------------------------------------------------------
# Delete a learning material
# ---------------------------------------------------------

@router.delete("/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_material(
    video_id: int,
    material_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a learning material (owner only)."""
    _get_video_or_404(db, video_id, current_user)
    material = _get_material_or_404(db, video_id, material_id)
    db.delete(material)
    db.commit()
    return None