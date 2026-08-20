"""
Learning material share router: endpoints for creating shareable links that let
students/learners view study notes without needing editor access.

Two routers:
  1. ``router``        — /api/videos/{video_id}/learning-materials/{material_id}/shares
                         (owner management)
  2. ``public_router`` — /api/learning-material-shares/{token}  (public student view)
"""
import secrets
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.learning_material import LearningMaterial
from app.models.learning_material_share import LearningMaterialShare
from app.models.video import Video
from app.schemas.learning_material import LearningMaterialContent
from app.schemas.learning_material_share import (
    LearningMaterialShareRead,
    SharedLearningMaterialView,
)
from app.services.video_service import VideoService

logger = logging.getLogger(__name__)



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


def _get_material_or_404(
    db: Session,
    video_id: int,
    material_id: int,
    current_user,
) -> LearningMaterial:
    """Fetch a learning material and verify ownership of its video."""
    _get_video_or_404(db, video_id, current_user)
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
# Owner-facing share management
# ---------------------------------------------------------

router = APIRouter(
    prefix="/api/videos/{video_id}/learning-materials/{material_id}/shares",
    tags=["Learning Material Shares"],
)


@router.get("/", response_model=List[LearningMaterialShareRead])
def list_material_shares(
    video_id: int,
    material_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all share links for a learning material (owner only)."""
    _get_material_or_404(db, video_id, material_id, current_user)
    shares = (
        db.query(LearningMaterialShare)
        .filter(LearningMaterialShare.material_id == material_id)
        .order_by(LearningMaterialShare.created_at.desc())
        .all()
    )
    return shares


@router.post("/", response_model=LearningMaterialShareRead, status_code=status.HTTP_201_CREATED)
def create_material_share(
    video_id: int,
    material_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a shareable study-notes link (owner only).

    If an active share already exists for this material, the existing link is
    returned so educators can copy the same URL.
    """
    _get_material_or_404(db, video_id, material_id, current_user)

    existing = (
        db.query(LearningMaterialShare)
        .filter(
            LearningMaterialShare.material_id == material_id,
            LearningMaterialShare.is_active.is_(True),
        )
        .first()
    )
    if existing is not None:
        return existing

    share = LearningMaterialShare(
        material_id=material_id,
        token=secrets.token_urlsafe(24),
        created_by=current_user.id,
        is_active=True,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share
@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_material_share(
    video_id: int,
    material_id: int,
    share_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke a study-notes share link so it no longer resolves (owner only)."""
    _get_material_or_404(db, video_id, material_id, current_user)

    share = (
        db.query(LearningMaterialShare)
        .filter(
            LearningMaterialShare.id == share_id,
            LearningMaterialShare.material_id == material_id,
        )
        .first()
    )
    if share is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )

    share.is_active = False
    db.add(share)
    db.commit()
    return None


# ---------------------------------------------------------
# Public share view (no authentication required)
# ---------------------------------------------------------

public_router = APIRouter(
    prefix="/api/learning-material-shares",
    tags=["Learning Material Shares - Public"],
)


@public_router.get("/{token}", response_model=SharedLearningMaterialView)
def get_shared_learning_material(token: str, db: Session = Depends(get_db)):
    """Publicly resolve a token into the learning material's study notes.

    No authentication is required — a valid, active token is the key, which
    makes it easy for students to open the link from any browser.
    """
    share = (
        db.query(LearningMaterialShare)
        .filter(
            LearningMaterialShare.token == token,
            LearningMaterialShare.is_active.is_(True),
        )
        .first()
    )
    if share is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or has been revoked",
        )

    material = (
        db.query(LearningMaterial)
        .filter(LearningMaterial.id == share.material_id)
        .first()
    )
    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning material not found",
        )

    video = VideoService.get_video_by_id(db, material.video_id)
    if video is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    educator_name = video.user.full_name or video.user.username if video.user else "Educator"

    return SharedLearningMaterialView(
        video_id=video.id,
        video_title=video.title,
        educator_name=educator_name,
        material_id=material.id,
        title=material.title,
        content=LearningMaterialContent(**material.content),
        shared_at=share.created_at,
    )