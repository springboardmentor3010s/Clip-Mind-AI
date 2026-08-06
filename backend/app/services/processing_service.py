import json
import time

from sqlalchemy.sql import func

from app.database.postgres import SessionLocal
from app.models.video import Video

from app.services.ai_pipeline import process_video
from app.services.transcript_service import save_transcript
from app.services.video_status_service import update_status
from app.services.ai_service import generate_ai_content
from app.services.ffmpeg_service import get_video_duration


def process_uploaded_video(
    video_id: int,
    filepath: str
):
    db = SessionLocal()

    try:

        video = (
            db.query(Video)
            .filter(Video.id == video_id)
            .first()
        )
        
        if not video:
            return
        video.duration = get_video_duration(filepath)
        video.processing_started = func.now()
        db.commit()

        # -------------------------------
        # Extract Audio
        # -------------------------------
        update_status(
            db,
            video.id,
            "Processing",
            "Extracting Audio",
            20
        )

        ai_result = process_video(filepath)

        # -------------------------------
        # Transcript Generated
        # -------------------------------
        update_status(
            db,
            video.id,
            "Processing",
            "Generating Transcript",
            50
        )

        # -------------------------------
        # Save Transcript
        # -------------------------------
        update_status(
            db,
            video.id,
            "Processing",
            "Saving Transcript",
            70
        )

        save_transcript(
            db,
            video.id,
            ai_result["transcript"]["text"],
            ai_result["transcript"]["segments"]
        )

        # -------------------------------
        # Generate AI Content
        # -------------------------------
        update_status(
            db,
            video.id,
            "Processing",
            "Generating Summary",
            90
        )

        ai = generate_ai_content(
            ai_result["transcript"]["text"]
        )

        video.summary = ai["summary"]

        video.topics = json.dumps(
            ai["topics"]
        )

        video.key_moments = json.dumps(
            ai["key_moments"]
        )

        video.quiz = json.dumps(
            ai["quiz"]
        )

        video.flashcards = json.dumps(
            ai["flashcards"]
        )

        video.processing_completed = func.now()

        db.commit()

        # -------------------------------
        # Completed
        # -------------------------------
        update_status(
            db,
            video.id,
            "Completed",
            "Completed",
            100
        )

    except Exception as e:

        update_status(
            db,
            video_id,
            "Failed",
            str(e),
            0
        )

        video = (
            db.query(Video)
            .filter(Video.id == video_id)
            .first()
        )

        if video:
            video.error_message = str(e)
            db.commit()

    finally:
        db.close()