# backend/app/core/processing.py
import subprocess
import os
import logging
from ..services.summarization_service import generate_summaries
from ..services.transcription_service import generate_transcript
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
# --- Import the correct model class name ---
from app.models.video import VideoMetadata 


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VideoPipeline")

THUMBNAIL_DIR = os.path.join(os.getcwd(), "storage", "thumbnails")
os.makedirs(THUMBNAIL_DIR, exist_ok=True)

# Inside your pipeline worker function (e.g., process_video_pipeline):
# Inside your pipeline worker function (e.g., process_video_pipeline):
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.video import VideoMetadata  # Update to match your actual model import path

from app.core.database import SessionLocal
from app.models.video import VideoMetadata
from app.services.transcription_service import generate_transcript
from app.services.summarization_service import generate_summaries
from app.services.analytics_service import AnalyticsService

def process_video_pipeline(video_id: int, file_path: str):
    """Background task accepting video_id and file_path with full Milestone 3 analytics."""
    db = SessionLocal()
    try:
        video = db.query(VideoMetadata).filter(VideoMetadata.id == video_id).first()
        if not video:
            print(f"❌ Video #{video_id} not found in database.")
            return

        print(f"⏳ Starting processing pipeline for Video #{video_id}...")

        # 1. Process Speech-to-Text (Whisper)
        raw_transcript = generate_transcript(file_path)
        
        # Safely extract text string and segment array
        if isinstance(raw_transcript, dict):
            transcript_text = raw_transcript.get("full_text", "")
            segments = raw_transcript.get("segments", [])
        else:
            transcript_text = str(raw_transcript)
            segments = []

        # 2. Process NLP Summarization (BART)
        ai_summary = generate_summaries(transcript_text)
        if isinstance(ai_summary, dict):
            summary_text = ai_summary.get("detailed_summary") or ai_summary.get("short_summary") or str(ai_summary)
        else:
            summary_text = str(ai_summary)

        # 3. Milestone 3: Key Moments Detection & Content Analytics
        keywords = AnalyticsService.extract_keywords(transcript_text)
        key_moments = AnalyticsService.detect_key_moments(transcript_text, segments)
        analytics_data = AnalyticsService.generate_content_analytics(transcript_text, summary_text)

        # 4. Update Database Fields
        video.transcript = transcript_text
        video.summary = summary_text
        
        if hasattr(video, "keywords"):
            video.keywords = keywords
            
        if hasattr(video, "key_moments"):
            video.key_moments = key_moments
            
        if hasattr(video, "analytics_data"):
            video.analytics_data = analytics_data
            
        if hasattr(video, "status"):
            video.status = "COMPLETED"

        db.add(video)
        db.commit()
        db.refresh(video)
        
        print(f"✅ Successfully processed Video #{video_id} (Transcript, Summary, Key Moments & Analytics generated)")

    except Exception as e:
        db.rollback()
        print(f"💥 Pipeline crashed for Video #{video_id}: {e}")
        
        # Mark video status as FAILED on exception
        try:
            failed_video = db.query(VideoMetadata).filter(VideoMetadata.id == video_id).first()
            if failed_video and hasattr(failed_video, "status"):
                failed_video.status = "FAILED"
                db.commit()
        except Exception as inner_e:
            print(f"Could not update status to FAILED: {inner_e}")
            
    finally:
        db.close()