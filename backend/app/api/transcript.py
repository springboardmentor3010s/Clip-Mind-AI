from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_content_manager
from app.core.cache import cache_get, cache_set, cache_delete
from app.models.user import User
from app.models.transcript import Transcript
from app.models.video import Video, VideoStatus
from app.schemas.transcript import TranscriptUpdate, TranscriptResponse

from app.services.transcription import process_video_transcription

router = APIRouter(prefix="/transcript", tags=["transcript"])

def _cache_key(video_id: int) -> str:
    return f"transcript:{video_id}"

@router.get("/{video_id}", response_model=TranscriptResponse)
def get_transcript(video_id: int, db: Session = Depends(get_db)):
    cached = cache_get(_cache_key(video_id))
    if cached:
        return cached

    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    response = TranscriptResponse.model_validate(transcript).model_dump()
    cache_set(_cache_key(video_id), response, ttl_seconds=3600)
    return transcript

@router.put("/{video_id}", response_model=TranscriptResponse)
def update_transcript(video_id: int, updates: TranscriptUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")

    # Update segments
    if not transcript.segments:
        transcript.segments = []
    
    current_segments = list(transcript.segments) # copy
    update_map = {u.id: u.text for u in updates.segments}
    
    # Iterate through current segments and update text if an update exists
    for i, seg in enumerate(current_segments):
        seg_id = str(seg.get("id"))
        if seg_id in update_map:
            current_segments[i]["text"] = update_map[seg_id]
            
    # Also update the full text based on modified segments
    new_full_text = " ".join([seg.get("text", "") for seg in current_segments])
    
    # Since JSON columns aren't automatically tracked by SQLAlchemy if modified in place
    transcript.segments = current_segments
    transcript.text = new_full_text

    db.commit()
    db.refresh(transcript)
    cache_delete(_cache_key(video_id))
    return transcript

@router.post("/{video_id}/regenerate", response_model=dict)
def regenerate_transcript(video_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Re-runs Whisper transcription for a video, discarding the existing transcript."""
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    db.query(Transcript).filter(Transcript.video_id == video_id).delete()
    video.status = VideoStatus.UPLOADED
    db.commit()
    cache_delete(_cache_key(video_id))

    background_tasks.add_task(process_video_transcription, video_id)
    return {"message": "Transcript regeneration started", "video_id": video_id}

from fastapi.responses import PlainTextResponse

@router.get("/{video_id}/export")
def export_transcript(video_id: int, db: Session = Depends(get_db)):
    """Exports the transcript as a downloadable text file."""
    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found")
        
    # Track Export Analytics
    try:
        from app.models.analytics import AnalyticsEvent
        import logging
        logger = logging.getLogger(__name__)
        event = AnalyticsEvent(video_id=video_id, event_type="export_txt", metadata_val="transcript")
        db.add(event)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to track transcript export: {e}")

    return PlainTextResponse(
        content=transcript.text,
        headers={
            "Content-Disposition": f'attachment; filename="video_{video_id}_transcript.txt"'
        }
    )
