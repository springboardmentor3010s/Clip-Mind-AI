import os
import whisper
from sqlalchemy.orm import Session

from app.models.video import Video

# Load Whisper model only once
model = whisper.load_model("base")


# ==========================================
# Generate Transcript
# ==========================================

def transcribe_video(video_path: str) -> str:
    """
    Generate transcript using Whisper.
    """

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    print("Starting transcription...")

    result = model.transcribe(video_path)

    transcript = result["text"]

    print("Transcription completed.")

    return transcript


# ==========================================
# Get Transcript
# ==========================================

def get_transcript(db: Session, video_id: int):
    """
    Fetch transcript from PostgreSQL.
    """

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    if not video.transcript:
        return {
            "success": False,
            "message": "Transcript not generated yet."
        }

    return {
        "success": True,
        "video_id": video.id,
        "title": video.title,
        "transcript": video.transcript,
        "status": video.status
    }


# ==========================================
# Regenerate Transcript
# ==========================================

def regenerate_transcript(db: Session, video_id: int):
    """
    Regenerate transcript from the original video.
    """

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    transcript = transcribe_video(video.file_path)

    video.transcript = transcript

    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "video_id": video.id,
        "transcript": video.transcript
    }