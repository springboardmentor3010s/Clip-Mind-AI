import json
import os

from sqlalchemy.orm import Session

from models.db_models import Video
from services import ffmpeg_service, whisper_service, nlp_service, moments_service, analytics_service
from services.time_utils import fmt
import config


def run_transcription(db: Session, video: Video) -> Video:
    """Extract audio (if needed) and run whisper, persisting results on the Video row."""
    try:
        video.status = "Processing"
        db.commit()

        audio_path = video.audio_path
        if not audio_path or not os.path.exists(audio_path):
            audio_path = os.path.join(config.AUDIO_DIR, f"{video.id}.wav")
            ffmpeg_service.extract_audio(video.file_path, audio_path)
            video.audio_path = audio_path
            db.commit()

        segments, language_label = whisper_service.transcribe(audio_path)

        video.transcript_json = json.dumps(segments)
        video.language = language_label
        if segments:
            video.duration_seconds = max(video.duration_seconds, segments[-1]["seconds"])
        video.status = "Processing"
        db.commit()
        db.refresh(video)
        return video
    except Exception as e:  # noqa: BLE001
        video.status = "Failed"
        video.error = str(e)
        db.commit()
        raise


def run_summary(db: Session, video: Video) -> Video:
    segments = json.loads(video.transcript_json or "[]")
    full_text = " ".join(s["text"] for s in segments)
    summary = nlp_service.build_summary(video.title, fmt(video.duration_seconds), full_text)
    video.summary_json = json.dumps(summary)
    db.commit()
    db.refresh(video)
    return video


def run_moments(db: Session, video: Video) -> Video:
    segments = json.loads(video.transcript_json or "[]")
    moments = moments_service.build_moments(segments, top_n=6)
    video.moments_json = json.dumps(moments)
    db.commit()
    db.refresh(video)
    return video


def run_analytics(db: Session, video: Video) -> Video:
    segments = json.loads(video.transcript_json or "[]")
    moments = json.loads(video.moments_json or "[]")
    full_text = " ".join(s["text"] for s in segments)
    analytics = analytics_service.build_analytics(segments, moments, full_text)
    video.analytics_json = json.dumps(analytics)
    video.status = "Processed"
    db.commit()
    db.refresh(video)
    return video


def run_full_pipeline(db: Session, video: Video) -> Video:
    """Run transcript -> summary -> moments -> analytics end to end for one video."""
    run_transcription(db, video)
    run_summary(db, video)
    run_moments(db, video)
    run_analytics(db, video)
    return video
