"""
Summary share router: endpoints for creating shareable links that let
students/learners view a video summary without needing editor access.

Two routers:
  1. ``router``       — /api/videos/{video_id}/shares  (owner management)
  2. ``public_router`` — /api/shares/{token}           (public student view)
"""
import secrets
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.database import get_db
from app.models.summary_share import SummaryShare
from app.models.video import Video
from app.schemas.summary_share import SharedSummaryView, SummaryShareRead
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


# ---------------------------------------------------------
# Owner-facing share management
# ---------------------------------------------------------

router = APIRouter(
    prefix="/api/videos/{video_id}/shares",
    tags=["Summary Shares"],
)


@router.get("/", response_model=List[SummaryShareRead])
def list_shares(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all share links for a video (owner only)."""
    _get_video_or_404(db, video_id, current_user)
    shares = (
        db.query(SummaryShare)
        .filter(SummaryShare.video_id == video_id)
        .order_by(SummaryShare.created_at.desc())
        .all()
    )
    return shares


@router.post("/", response_model=SummaryShareRead, status_code=status.HTTP_201_CREATED)
def create_share(
    video_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a shareable summary link (owner only).

    If an active share already exists for this video, the existing link is
    returned so educators can copy the same URL.
    """
    video = _get_video_or_404(db, video_id, current_user)

    existing = (
        db.query(SummaryShare)
        .filter(
            SummaryShare.video_id == video_id,
            SummaryShare.is_active.is_(True),
        )
        .first()
    )
    if existing is not None:
        return existing

    share = SummaryShare(
        video_id=video_id,
        token=secrets.token_urlsafe(24),
        created_by=current_user.id,
        is_active=True,
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return share


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(
    video_id: int,
    share_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke a share link so it no longer resolves (owner only)."""
    _get_video_or_404(db, video_id, current_user)

    share = (
        db.query(SummaryShare)
        .filter(SummaryShare.id == share_id, SummaryShare.video_id == video_id)
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
    prefix="/api/shares",
    tags=["Summary Shares - Public"],
)


@public_router.get("/{token}", response_model=SharedSummaryView)
def get_shared_summary(token: str, db: Session = Depends(get_db)):
    """Publicly resolve a share token into the video's summary.

    No authentication is required — a valid, active token is the key, which
    makes it easy for students to open the link from any browser.
    """
    share = (
        db.query(SummaryShare)
        .filter(SummaryShare.token == token, SummaryShare.is_active.is_(True))
        .first()
    )
    if share is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or has been revoked",
        )

    video = VideoService.get_video_by_id(db, share.video_id)
    if video is None or video.summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not available for this share link",
        )

    educator_name = video.user.full_name or video.user.username if video.user else "Educator"

    return SharedSummaryView(
        video_id=video.id,
        video_title=video.title,
        educator_name=educator_name,
        short_summary=video.summary.short_summary,
        detailed_summary=video.summary.detailed_summary,
        bullet_points=video.summary.bullet_points or [],
        shared_at=share.created_at,
    )