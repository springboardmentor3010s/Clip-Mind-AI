from fastapi import HTTPException
from sqlalchemy.orm import Session

import os
import shutil
import time

from app.utils.file_validation import is_valid_video

from app.crud.video import create_video
from app.crud.transcript import create_transcript
from app.crud.summary import create_summary
from app.crud.transcript_segment import create_transcript_segments

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


def process_uploaded_video(
    db: Session,
    file,
    current_user,
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

    # Extract metadata
    metadata = get_video_metadata(file_path)

    duration = float(
        metadata.get("format", {}).get("duration", 0)
    )

    file_size = os.path.getsize(file_path)

    # Extract audio
    audio_path = extract_audio(file_path)

    # Generate thumbnail
    thumbnail_path = generate_thumbnail(file_path)

    # Generate transcript
    transcript_path, transcript_text, language, segments = transcribe_audio(
        audio_path
    )

    # Save video details
    video = create_video(
        db=db,
        filename=file.filename,
        filepath=file_path,
        audio_path=audio_path,
        thumbnail_path=thumbnail_path,
        duration=duration,
        file_size=file_size,
        owner_id=current_user.id,
    )

    # Save transcript
    transcript = create_transcript(
    db=db,
    video=video,
    transcript_text=transcript_text,
    transcript_file_path=transcript_path,
    language=language,
)

    create_transcript_segments(
    db=db,
    transcript_id=transcript.id,
    video_id=video.id,
    segments=segments
)

    # Generate short summary
    start_time = time.time()

    short_summary = generate_short_summary(
        transcript_text
    )

    processing_time = f"{time.time() - start_time:.2f} sec"

    # Generate detailed summary
    detailed_summary = generate_detailed_summary(
    transcript_text
)

    # Save summary
    create_summary(
        db=db,
        video=video,
        summary_type="short",
        summary_text=short_summary,
        model_name="t5-small",
        processing_time=processing_time,
    )

    create_summary(
    db=db,
    video=video,
    summary_type="detailed",
    summary_text=detailed_summary,
    model_name="t5-small",
    processing_time=processing_time,
)

    # Debug prints
    print(metadata)
    print(audio_path)
    print(thumbnail_path)
    print(transcript_path)
    print(transcript_text)
    print(short_summary)
    print(detailed_summary)

    return video