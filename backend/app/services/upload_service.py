import os
import uuid
import shutil

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models.video import Video

from app.services.processing_service import (
    extract_video_metadata,
    generate_thumbnail,
    compress_video
)

from app.services.transcription_service import transcribe_video


# ==========================================
# Upload Directory
# ==========================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

UPLOAD_DIR = os.path.join(
    BASE_DIR,
    "uploads",
    "videos"
)

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==========================================
# Upload Video
# ==========================================

def upload_video(db: Session, file: UploadFile, user_id: int):

    # Generate unique filename
    extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{extension}"

    # Physical file path
    filepath = os.path.join(
        UPLOAD_DIR,
        filename
    )

    # Save video
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(filepath)

    print("Video Saved:", filepath)

    # Extract Metadata
    metadata = extract_video_metadata(filepath)

    # Generate Thumbnail
    thumbnail_path = generate_thumbnail(filepath)

    # Compress Video
    compressed_path = compress_video(filepath)

    # Generate Transcript
    transcript = transcribe_video(filepath)

    # URL paths for frontend
    video_url = f"/uploads/videos/{filename}"

    thumbnail_url = (
        thumbnail_path.replace("\\", "/")
        if thumbnail_path else None
    )

    compressed_url = (
        compressed_path.replace("\\", "/")
        if compressed_path else None
    )

    # Save Database
    video = Video(

        uploaded_by=user_id,

        title=file.filename,

        filename=filename,

        file_path=video_url,

        file_size=file_size,

        content_type=file.content_type,

        duration=metadata.get("duration"),

        width=metadata.get("width"),

        height=metadata.get("height"),

        codec=metadata.get("codec"),

        thumbnail_path=thumbnail_url,

        compressed_path=compressed_url,

        transcript=transcript,

        summary=None,

        key_moments=None,

        status="Processed"

    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return {
        "video": video,
        "metadata": metadata,
        "thumbnail": thumbnail_url,
        "compressed": compressed_url,
        "transcript": transcript
    }