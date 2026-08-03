import os
import shutil
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.utils.video_processor import extract_audio
from app.models import Video
from app.utils.transcriber import generate_transcript
from app.utils.summarizer import generate_summary

UPLOAD_FOLDER = "uploads"


def save_video(
    db: Session,
    file: UploadFile,
    user_id: int,
):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    unique_filename = (
        str(uuid.uuid4())
        + "_"
        + file.filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    video = Video(
    filename=unique_filename,
    original_filename=file.filename,
    file_path=file_path,
    uploaded_by=user_id,
    status="Processing",
    )

    db.add(video)
    db.commit()
    db.refresh(video)
    print("1. video saved")

    try:
        print("2. starting extracting audio")

        # Extract audio
        audio_path = extract_audio(file_path)

        print("3. audio extraction complete")

        print("4. starting generating transcript")

        # Generate transcript
        transcript = generate_transcript(audio_path)

        print("5. transcript generation complete")

        print("6. starting generating summary")

        # Generate summary
        summary = generate_summary(transcript)

        print("7. summary generation complete")

        # Save transcript & summary
        video.transcript = transcript
        video.summary = summary
        video.status = "Completed"

        db.commit()
        db.refresh(video)

    except Exception as e:
        print("ERROR:", e)

        video.status = "Failed"

        db.commit()
        db.refresh(video)

    print("8. returning response")

    return video