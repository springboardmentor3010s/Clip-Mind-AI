import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_content_manager
from app.models.user import User
from app.models.video import Video
from app.models.summary import Summary
from app.models.key_moment import KeyMoment
from app.models.transcript import Transcript
from app.models.shared_link import SharedLink
from app.schemas.shared_link import SharedLinkCreate, SharedLinkResponse, SharedContentResponse

router = APIRouter(tags=["share"])


@router.post("/share", response_model=SharedLinkResponse)
def create_shared_link(
    req: SharedLinkCreate,
    current_user: User = Depends(require_content_manager),
    db: Session = Depends(get_db),
):
    video = db.query(Video).filter(Video.id == req.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    link = SharedLink(
        video_id=req.video_id,
        created_by=current_user.id,
        token=secrets.token_urlsafe(16),
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/share/mine", response_model=list[SharedLinkResponse])
def list_my_shared_links(
    current_user: User = Depends(require_content_manager),
    db: Session = Depends(get_db),
):
    return (
        db.query(SharedLink)
        .filter(SharedLink.created_by == current_user.id)
        .order_by(SharedLink.created_at.desc())
        .all()
    )


@router.delete("/share/{link_id}")
def revoke_shared_link(
    link_id: int,
    current_user: User = Depends(require_content_manager),
    db: Session = Depends(get_db),
):
    link = db.query(SharedLink).filter(SharedLink.id == link_id, SharedLink.created_by == current_user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Shared link not found")
    db.delete(link)
    db.commit()
    return {"message": "Shared link revoked."}


@router.get("/share/{token}", response_model=SharedContentResponse)
def get_shared_content(token: str, db: Session = Depends(get_db)):
    """Public, unauthenticated: what a student sees from a share link."""
    link = db.query(SharedLink).filter(SharedLink.token == token).first()
    if not link:
        raise HTTPException(status_code=404, detail="This share link is invalid or has been revoked.")

    video = db.query(Video).filter(Video.id == link.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    summary = db.query(Summary).filter(Summary.video_id == video.id).first()
    moments = (
        db.query(KeyMoment)
        .filter(KeyMoment.video_id == video.id)
        .order_by(KeyMoment.start_time.asc())
        .all()
    )
    transcript = db.query(Transcript).filter(Transcript.video_id == video.id).first()

    return {
        "video_title": video.title,
        "duration_seconds": video.duration_seconds or 0,
        "summary_short": summary.short_summary if summary else None,
        "summary_detailed": summary.detailed_summary if summary else None,
        "key_moments": [
            {"start_time": m.start_time, "end_time": m.end_time, "title": m.title, "description": m.description}
            for m in moments
        ],
        "keywords": transcript.keywords if transcript and transcript.keywords else [],
        "shared_by": link.creator.username if link.creator else "Unknown",
    }
