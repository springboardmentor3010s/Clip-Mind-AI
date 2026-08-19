from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_content_manager
from app.core.cache import cache_get, cache_set, cache_delete
from app.models.user import User
from app.models.summary import Summary
from app.schemas.summary import SummaryCreate, SummaryResponse
from app.services.summarization import generate_summary
from app.core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summary", tags=["summary"])

def _cache_key(video_id: int) -> str:
    return f"summary:{video_id}"

def process_summary_background(video_id: int, text: str):
    """Background task to generate summaries."""
    db: Session = SessionLocal()
    try:
        print(f"\n=================== [SUMMARY START] Video ID: {video_id} ===================", flush=True)
        print(f"[SUMMARY] Input text length: {len(text)} chars", flush=True)
        
        print(f"[SUMMARY] Generating short summary...", flush=True)
        short_text = generate_summary(text, detailed=False)
        print(f"[SUMMARY] Short summary ({len(short_text)} chars): {short_text[:200]}...", flush=True)
        
        print(f"[SUMMARY] Generating detailed summary...", flush=True)
        detailed_text = generate_summary(text, detailed=True)
        print(f"[SUMMARY] Detailed summary ({len(detailed_text)} chars): {detailed_text[:200]}...", flush=True)
        
        # Save to database
        summary_record = db.query(Summary).filter(Summary.video_id == video_id).first()
        
        if not summary_record:
            summary_record = Summary(video_id=video_id, short_summary=short_text, detailed_summary=detailed_text)
            db.add(summary_record)
            print(f"[SUMMARY] Created new summary record for video {video_id}", flush=True)
        else:
            summary_record.short_summary = short_text
            summary_record.detailed_summary = detailed_text
            print(f"[SUMMARY] Updated existing summary record for video {video_id}", flush=True)
            
        db.commit()
        cache_delete(_cache_key(video_id))
        print(f"=================== [SUMMARY COMPLETE] Video ID: {video_id} ===================\n", flush=True)
    except Exception as e:
        import traceback
        print(f"[SUMMARY ERROR] Video ID {video_id} failed: {e}", flush=True)
        traceback.print_exc()
        logger.error(f"Background summarization failed for video {video_id}: {e}")
    finally:
        db.close()

@router.post("/generate", response_model=dict)
def trigger_summary_generation(req: SummaryCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Triggers NLP summarization in the background to avoid blocking the API."""
    background_tasks.add_task(process_summary_background, req.video_id, req.text)
    return {"message": "Summarization started in the background", "video_id": req.video_id}

@router.get("/{video_id}", response_model=SummaryResponse)
def get_summary(video_id: int, db: Session = Depends(get_db)):
    """Fetches summaries for a given video ID."""
    cached = cache_get(_cache_key(video_id))
    if cached:
        return cached

    summary_record = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary_record:
        raise HTTPException(status_code=404, detail="Summary not found")

    response = SummaryResponse.model_validate(summary_record).model_dump()
    cache_set(_cache_key(video_id), response, ttl_seconds=3600)
    return summary_record

@router.put("/{video_id}", response_model=SummaryResponse)
def update_summary(video_id: int, req: SummaryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_content_manager)):
    """Updates an existing summary."""
    summary_record = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary_record:
        raise HTTPException(status_code=404, detail="Summary not found")
        
    summary_record.short_summary = req.text if not req.detailed else summary_record.short_summary
    # If we had a schema for updating both short and detailed explicitly we would use that.
    # For now, let's assume the client passes the modified text and detailed flag.
    if req.detailed:
        summary_record.detailed_summary = req.text
    else:
        summary_record.short_summary = req.text
        
    db.commit()
    db.refresh(summary_record)
    cache_delete(_cache_key(video_id))
    return summary_record

from fastapi.responses import PlainTextResponse

@router.get("/{video_id}/export")
def export_summary(video_id: int, type: str = 'short', db: Session = Depends(get_db)):
    """Exports the summary as a downloadable text file."""
    summary_record = db.query(Summary).filter(Summary.video_id == video_id).first()
    if not summary_record:
        raise HTTPException(status_code=404, detail="Summary not found")
        
    content = summary_record.detailed_summary if type == 'detailed' else summary_record.short_summary
    
    # Track Export Analytics
    try:
        from app.models.analytics import AnalyticsEvent
        event = AnalyticsEvent(video_id=video_id, event_type="export_txt", metadata_val=f"summary_{type}")
        db.add(event)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to track summary export: {e}")
    
    return PlainTextResponse(
        content=content,
        headers={
            "Content-Disposition": f'attachment; filename="video_{video_id}_summary_{type}.txt"'
        }
    )
