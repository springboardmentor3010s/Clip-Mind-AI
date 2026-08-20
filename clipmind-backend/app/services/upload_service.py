from fastapi import HTTPException
from sqlalchemy.orm import Session

import os
import shutil
import time

from app.database.connection import SessionLocal

from app.utils.file_validation import is_valid_video

from app.crud.video import (
    create_video,
    update_video_status
)

from app.crud.transcript import create_transcript
from app.crud.summary import create_summary
from app.crud.transcript_segment import create_transcript_segments

from app.core.enums import VideoStatus

from app.services.ffmpeg_service import (
    get_video_metadata,
    extract_audio,
    generate_thumbnail,
)

from app.services.transcription_service import (
    transcribe_audio,
)

from app.services.summarization_service import (
    generate_short_summary,
    generate_detailed_summary,
)


def save_uploaded_video(
    db: Session,
    file,
    current_user,
    classroom_id=None
):
    # Validate uploaded file
    if not is_valid_video(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format."
        )

    # Create uploads folder
    os.makedirs("uploads", exist_ok=True)

    # Save uploaded video
    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # Get basic metadata only
    metadata = get_video_metadata(file_path)

    duration = float(
        metadata.get("format", {}).get("duration", 0)
    )

    file_size = os.path.getsize(file_path)

    # Create database record immediately
    video = create_video(
        db=db,
        filename=file.filename,
        filepath=file_path,
        duration=duration,
        file_size=file_size,
        owner_id=current_user.id,
        classroom_id=classroom_id
    )

    return video


def process_video_in_background(
    video_id: int
):
    db = SessionLocal()

    try:
        video = (
            db.query(__import__(
                "app.models.video",
                fromlist=["Video"]
            ).Video)
            .filter(
                __import__(
                    "app.models.video",
                    fromlist=["Video"]
                ).Video.id == video_id
            )
            .first()
        )

        if video is None:
            return

        # Ensure processing status
        update_video_status(
            db=db,
            video=video,
            status=VideoStatus.PROCESSING.value
        )

        # Extract audio
        audio_path = extract_audio(
            video.filepath
        )

        video.audio_path = audio_path
        db.commit()
        db.refresh(video)

        # Generate thumbnail
        thumbnail_path = generate_thumbnail(
            video.filepath
        )

        video.thumbnail_path = thumbnail_path
        db.commit()
        db.refresh(video)

        # Generate transcript
        transcript_path, transcript_text, language, segments = (
            transcribe_audio(audio_path)
        )

        # Save transcript
        transcript = create_transcript(
            db=db,
            video=video,
            transcript_text=transcript_text,
            transcript_file_path=transcript_path,
            language=language,
        )

        # Save transcript segments
        create_transcript_segments(
            db=db,
            transcript_id=transcript.id,
            video_id=video.id,
            segments=segments
        )

        # Generate short summary
        short_start_time = time.time()

        short_summary = generate_short_summary(
            transcript_text
        )

        short_processing_time = (
            f"{time.time() - short_start_time:.2f} sec"
        )

        # Generate detailed summary
        detailed_start_time = time.time()

        detailed_summary = generate_detailed_summary(
            transcript_text
        )

        detailed_processing_time = (
            f"{time.time() - detailed_start_time:.2f} sec"
        )

        # Save short summary
        create_summary(
            db=db,
            video=video,
            summary_type="short",
            summary_text=short_summary,
            model_name="t5-small",
            processing_time=short_processing_time,
        )

        # Save detailed summary
        create_summary(
            db=db,
            video=video,
            summary_type="detailed",
            summary_text=detailed_summary,
            model_name="t5-small",
            processing_time=detailed_processing_time,
        )

        # Processing completed successfully
        update_video_status(
            db=db,
            video=video,
            status=VideoStatus.COMPLETED.value
        )

        print(
            f"Video {video.id} processing completed successfully."
        )

    except Exception as error:
        print(
            f"Background processing failed for video "
            f"{video_id}: {str(error)}"
        )

        try:
            video = (
                db.query(__import__(
                    "app.models.video",
                    fromlist=["Video"]
                ).Video)
                .filter(
                    __import__(
                        "app.models.video",
                        fromlist=["Video"]
                    ).Video.id == video_id
                )
                .first()
            )

            if video:
                update_video_status(
                    db=db,
                    video=video,
                    status=VideoStatus.FAILED.value
                )

        except Exception as status_error:
            print(
                f"Failed to update video status: "
                f"{str(status_error)}"
            )

    finally:
        db.close()