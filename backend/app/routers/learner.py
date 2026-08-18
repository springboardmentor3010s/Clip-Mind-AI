from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_claims
from app.models.video import VideoMetadata
from app.models.user import LearnerBookmark, LearnerHistory

router = APIRouter(prefix="/learner", tags=["Learner Experience Hub"])

class BookmarkPayload(BaseModel):
    video_id: int
    item_type: Optional[str] = "highlight"
    title: Optional[str] = "Key Moment"
    content: Optional[str] = "Saved study insight"
    timestamp_str: Optional[str] = "00:00"

# 1. Available Lectures Library
@router.get("/library")
def get_all_learner_lectures(
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    videos = db.query(VideoMetadata).order_by(VideoMetadata.id.desc()).all()
    return [
        {
            "id": v.id,
            "filename": v.filename,
            "status": v.status,
            "has_summary": bool(v.summary),
            "has_transcript": bool(v.transcript),
            "preview": (v.summary[:120] + "...") if v.summary else "Lecture processed and available for review."
        }
        for v in videos
    ]

# 2. Save a Bookmark
@router.post("/bookmarks")
def save_bookmark(
    payload: BookmarkPayload,
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    user_email = claims.get("email") or "learner@clipmind.ai"
    bookmark = LearnerBookmark(
        user_email=user_email,
        video_id=payload.video_id,
        item_type=payload.item_type or "highlight",
        title=payload.title or "Study Highlight",
        content=payload.content or "Saved concept insight.",
        timestamp_str=payload.timestamp_str or "00:00",
        created_at=datetime.now(timezone.utc)
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return {"status": "success", "bookmark_id": bookmark.id}

# 3. Retrieve All Bookmarks
@router.get("/bookmarks")
def get_user_bookmarks(
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    bookmarks = db.query(LearnerBookmark).order_by(LearnerBookmark.id.desc()).all()
    return [
        {
            "id": b.id,
            "video_id": b.video_id,
            "item_type": b.item_type,
            "title": b.title or "Study Bookmark",
            "content": b.content,
            "timestamp": b.timestamp_str or "00:00",
            "created_at": b.created_at.strftime("%b %d, %H:%M") if b.created_at else "Recently"
        }
        for b in bookmarks
    ]

# 4. Retrieve Learning History
@router.get("/history")
def get_user_history(
    db: Session = Depends(get_db),
    claims: dict = Depends(get_current_user_claims)
):
    history = db.query(LearnerHistory).order_by(LearnerHistory.last_accessed.desc()).all()
    return [
        {
            "id": h.id,
            "video_id": h.video_id,
            "video_filename": h.video_filename or f"Lecture #{h.video_id}",
            "last_accessed": h.last_accessed.strftime("%b %d, %H:%M") if h.last_accessed else "Recently"
        }
        for h in history
    ]

# 5. Search Transcripts
@router.get("/search")
def search_transcripts(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    videos = db.query(VideoMetadata).filter(VideoMetadata.transcript.isnot(None)).all()
    results = []
    for v in videos:
        text = v.transcript or ""
        if q.lower() in text.lower():
            idx = text.lower().find(q.lower())
            start = max(0, idx - 40)
            end = min(len(text), idx + len(q) + 40)
            results.append({
                "video_id": v.id,
                "filename": v.filename,
                "snippet": f"...{text[start:end]}..."
            })
    return {"query": q, "results": results}