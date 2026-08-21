import os
import time
import whisper
from sqlalchemy.orm import Session

from app.models.video import Video

# ==========================================
# Load Whisper Model Once
# ==========================================

model = whisper.load_model("base")
# For faster speed during development:
# model = whisper.load_model("tiny")

# ==========================================
# Generate Transcript
# ==========================================

def transcribe_video(video_path: str) -> str:
    """
    Generate transcript using Whisper.
    """

    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    start_time = time.time()

    print("Starting transcription...")

    result = model.transcribe(
        video_path,
        fp16=False
    )

    transcript = result["text"].strip()

    end_time = time.time()

    print(f"Transcription completed in {end_time-start_time:.2f} seconds.")

    return transcript


# ==========================================
# Get Transcript
# ==========================================

def get_transcript(db: Session, video_id: int):

    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

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
# Generate / Regenerate Transcript
# ==========================================

def regenerate_transcript(
    db: Session,
    video_id: int,
    force=False
):

    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    # Return existing transcript unless force=True
    if video.transcript and not force:
        return {
            "success": True,
            "video_id": video.id,
            "title": video.title,
            "transcript": video.transcript,
            "status": video.status
        }

    try:

        video.status = "Processing Transcript"
        db.commit()

        transcript = transcribe_video(video.file_path)

        video.transcript = transcript
        video.status = "Transcript Generated"

        db.commit()
        db.refresh(video)

        return {
            "success": True,
            "video_id": video.id,
            "title": video.title,
            "transcript": video.transcript,
            "status": video.status
        }

    except Exception as e:

        video.status = "Transcript Failed"
        db.commit()

        return {
            "success": False,
            "message": str(e)
        }


# ==========================================
# Update Transcript (Educator)
# ==========================================

def update_transcript(
    db: Session,
    video_id: int,
    transcript: str
):

    video = db.query(Video).filter(
        Video.id == video_id
    ).first()

    if not video:
        return {
            "success": False,
            "message": "Video not found."
        }

    video.transcript = transcript
    video.status = "Transcript Edited"

    db.commit()
    db.refresh(video)

    return {
        "success": True,
        "video_id": video.id,
        "title": video.title,
        "transcript": video.transcript,
        "status": video.status
    }