from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.dependencies import get_db, require_content_manager
from app.core.database import SessionLocal
from app.core.cache import cache_delete
from app.models.user import User
from app.models.key_moment import KeyMoment
from app.models.transcript import Transcript
from app.schemas.key_moment import KeyMomentResponse, KeyMomentGenerateRequest
from app.services.key_moments import process_video_key_moments

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/key-moments", tags=["key_moments"])

def background_generate_key_moments(video_id: int):
    """Background task to extract and save key moments."""
    db: Session = SessionLocal()
    try:
        # Fetch the transcript for this video to get the segments
        transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
        if not transcript or not transcript.segments:
            logger.error(f"Cannot generate key moments for video {video_id}: No transcript segments found.")
            return

        # Generate the moments and keywords
        result = process_video_key_moments(transcript.segments)
        generated_moments = result["moments"]

        # Persist keywords onto the transcript
        transcript.keywords = result["keywords"]
        db.add(transcript)

        # Clear old moments if they exist
        db.query(KeyMoment).filter(KeyMoment.video_id == video_id).delete()

        # Save new moments
        for gm in generated_moments:
            km = KeyMoment(
                video_id=video_id,
                start_time=gm["start_time"],
                end_time=gm["end_time"],
                title=gm["title"],
                description=gm["description"]
            )
            db.add(km)
            
        db.commit()
        cache_delete(f"transcript:{video_id}", f"study_materials:{video_id}")
    except Exception as e:
        logger.error(f"Failed to generate key moments for video {video_id}: {e}")
        db.rollback()
    finally:
        db.close()

@router.post("/generate", response_model=dict)
def trigger_key_moments_generation(req: KeyMomentGenerateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Triggers the extraction of key moments in the background."""
    # Ensure video has a transcript before triggering
    transcript = db.query(Transcript).filter(Transcript.video_id == req.video_id).first()
    if not transcript or not transcript.segments:
        raise HTTPException(status_code=400, detail="Transcript segments are required to generate key moments.")
        
    background_tasks.add_task(background_generate_key_moments, req.video_id)
    return {"message": "Key moments extraction started", "video_id": req.video_id}

@router.get("/{video_id}", response_model=List[KeyMomentResponse])
def get_key_moments(video_id: int, db: Session = Depends(get_db)):
    """Fetches key moments for a given video ID."""
    moments = db.query(KeyMoment).filter(KeyMoment.video_id == video_id).order_by(KeyMoment.start_time.asc()).all()
    if not moments:
        return []
    return moments

from fastapi.responses import PlainTextResponse

def _format_timestamp(seconds: int) -> str:
    mins, secs = divmod(int(seconds), 60)
    return f"{mins:02d}:{secs:02d}"

@router.get("/{video_id}/export")
def export_key_moments(video_id: int, db: Session = Depends(get_db)):
    """Exports key moments and keywords as a downloadable highlight report."""
    moments = db.query(KeyMoment).filter(KeyMoment.video_id == video_id).order_by(KeyMoment.start_time.asc()).all()
    if not moments:
        raise HTTPException(status_code=404, detail="No key moments found for this video")

    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    keywords = transcript.keywords if transcript and transcript.keywords else []

    lines = [f"Highlight Report - Video {video_id}", ""]
    for moment in moments:
        lines.append(f"[{_format_timestamp(moment.start_time)} - {_format_timestamp(moment.end_time)}] {moment.title}")
        if moment.description:
            lines.append(moment.description)
        lines.append("")

    if keywords:
        lines.append("Top Keywords")
        lines.append(", ".join(keywords))

    # Track Export Analytics
    try:
        from app.models.analytics import AnalyticsEvent
        event = AnalyticsEvent(video_id=video_id, event_type="export_txt", metadata_val="highlights")
        db.add(event)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to track highlight report export: {e}")

    return PlainTextResponse(
        content="\n".join(lines),
        headers={
            "Content-Disposition": f'attachment; filename="video_{video_id}_highlights.txt"'
        }
    )
