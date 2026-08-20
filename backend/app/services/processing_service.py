import json
import os

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

    audio_path = None

    try:

        video = (
            db.query(Video)
            .filter(
                Video.id == video_id
            )
            .first()
        )

        if not video:
            return

        # -----------------------------------------
        # Initial processing state
        # -----------------------------------------

        video.processing_started = func.now()

        video.processing_stage = (
            "Starting Processing"
        )

        video.progress = 5

        db.commit()

        # -----------------------------------------
        # Get duration
        # -----------------------------------------

        try:

            video.duration = (
                get_video_duration(filepath)
            )

            db.commit()

        except Exception as e:

            print(
                f"Duration detection failed: {e}"
            )

        # -----------------------------------------
        # Extract Audio + Transcript
        # -----------------------------------------

        update_status(
            db,
            video.id,
            "Processing",
            "Extracting Audio",
            20
        )

        ai_result = process_video(
            filepath
        )

        audio_path = (
            ai_result.get("audio_path")
        )

        # -----------------------------------------
        # Transcript Generated
        # -----------------------------------------

        update_status(
            db,
            video.id,
            "Processing",
            "Transcript Generated",
            50
        )

        transcript_data = (
            ai_result.get(
                "transcript",
                {}
            )
        )

        transcript_text = (
            transcript_data.get(
                "text",
                ""
            )
        )

        transcript_segments = (
            transcript_data.get(
                "segments",
                []
            )
        )

        # -----------------------------------------
        # Save Transcript
        # -----------------------------------------

        update_status(
            db,
            video.id,
            "Processing",
            "Saving Transcript",
            60
        )

        save_transcript(
            db,
            video.id,
            transcript_text,
            transcript_segments
        )

        # -----------------------------------------
        # Generate AI Content
        # -----------------------------------------

        update_status(
            db,
            video.id,
            "Processing",
            "Generating AI Content",
            70
        )

        ai = generate_ai_content(
            transcript_text
        )

        # -----------------------------------------
        # Save AI Content
        # -----------------------------------------

        update_status(
            db,
            video.id,
            "Processing",
            "Saving AI Insights",
            90
        )

        video.summary = (
            ai.get("summary", "")
        )

        video.topics = json.dumps(
            ai.get("topics", [])
        )

        video.key_moments = json.dumps(
            ai.get("key_moments", [])
        )

        video.quiz = json.dumps(
            ai.get("quiz", [])
        )

        video.flashcards = json.dumps(
            ai.get("flashcards", [])
        )

        video.processing_stage = (
            "Finalizing"
        )

        video.progress = 95

        db.commit()

        # -----------------------------------------
        # Completed
        # -----------------------------------------

        video.processing_completed = (
            func.now()
        )

        db.commit()

        update_status(
            db,
            video.id,
            "Completed",
            "Completed",
            100
        )

    except Exception as e:

        db.rollback()

        print(
            f"Video processing failed "
            f"for {video_id}: {e}"
        )

        try:

            update_status(
                db,
                video_id,
                "Failed",
                "Processing Failed",
                0
            )

            video = (
                db.query(Video)
                .filter(
                    Video.id == video_id
                )
                .first()
            )

            if video:

                video.error_message = str(e)

                video.processing_stage = (
                    "Failed"
                )

                db.commit()

        except Exception as status_error:

            print(
                "Could not update failure status:",
                status_error
            )

    finally:

        # -----------------------------------------
        # Remove temporary audio
        # -----------------------------------------

        if audio_path:

            try:

                if os.path.exists(
                    audio_path
                ):

                    os.remove(
                        audio_path
                    )

                    print(
                        f"Removed temporary audio: "
                        f"{audio_path}"
                    )

            except Exception as cleanup_error:

                print(
                    "Audio cleanup failed:",
                    cleanup_error
                )

        db.close()