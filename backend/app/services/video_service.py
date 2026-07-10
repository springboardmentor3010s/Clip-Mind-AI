"""
Video Upload & Processing Module — business logic for saving, validating,
inspecting, and processing uploaded video files via FFmpeg.
"""
import subprocess
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.video import Video, VideoStatus
from app.models.user import User

ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",  # .mov
    "video/x-msvideo",  # .avi
    "video/webm",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm"}


def _validate_file(file: UploadFile, file_size_mb: float) -> None:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'.",
        )

    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large ({file_size_mb:.1f} MB). Max allowed: {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )


def _get_duration_seconds(file_path: str) -> int | None:
    """Use ffprobe (bundled with FFmpeg) to read video duration."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path,
            ],
            capture_output=True, text=True, timeout=15,
        )
        return int(float(result.stdout.strip()))
    except Exception:
        return None


def _standardize_format(input_path: str, output_path: str) -> bool:
    """Video Format Standardization: transcode to a consistent H.264/AAC MP4."""
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                output_path,
            ],
            capture_output=True, timeout=300, check=True,
        )
        return True
    except Exception:
        return False


def _extract_thumbnail(input_path: str, output_path: str, duration: int | None) -> bool:
    """Frame Extraction (Key Frames): grab one representative frame from the midpoint."""
    midpoint = str(duration // 2) if duration else "1"
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-ss", midpoint, "-i", input_path,
                "-frames:v", "1", "-q:v", "2",
                output_path,
            ],
            capture_output=True, timeout=60, check=True,
        )
        return True
    except Exception:
        return False


def _extract_audio_with_noise_reduction(input_path: str, output_path: str) -> bool:
    """
    Audio Extraction + Noise Reduction: pull the audio track, apply an FFT-based
    denoise filter, and downsample to 16kHz mono (also the ideal input format
    for Whisper transcription in the next milestone).
    """
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", input_path,
                "-vn",                      # no video
                "-af", "afftdn",             # noise reduction filter
                "-ar", "16000", "-ac", "1",  # 16kHz mono
                output_path,
            ],
            capture_output=True, timeout=300, check=True,
        )
        return True
    except Exception:
        return False


def process_video(video: Video) -> None:
    """
    Runs the Video Processing Module pipeline on an already-uploaded video:
    format standardization, key-frame thumbnail extraction, and audio
    extraction with noise reduction. Mutates the given Video object's fields
    in place; caller is responsible for committing to the DB.
    """
    input_path = video.file_path
    base_dir = Path(input_path).parent
    stem = Path(video.stored_filename).stem

    processed_path = base_dir / f"{stem}_standardized.mp4"
    thumbnail_path = base_dir / f"{stem}_thumb.jpg"
    audio_path = base_dir / f"{stem}_audio.wav"

    standardized_ok = _standardize_format(input_path, str(processed_path))
    thumbnail_ok = _extract_thumbnail(input_path, str(thumbnail_path), video.duration_seconds)
    audio_ok = _extract_audio_with_noise_reduction(input_path, str(audio_path))

    if standardized_ok:
        video.processed_path = str(processed_path)
    if thumbnail_ok:
        video.thumbnail_path = str(thumbnail_path)
    if audio_ok:
        video.audio_path = str(audio_path)

    # Audio extraction is the critical step for the next milestone (transcription),
    # so treat its failure as a pipeline failure even if other steps succeeded.
    video.status = VideoStatus.READY if audio_ok else VideoStatus.FAILED


def save_uploaded_video(
    db: Session,
    file: UploadFile,
    owner: User,
    title: str,
    description: str | None = None,
) -> Video:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    contents = file.file.read()
    file_size_mb = len(contents) / (1024 * 1024)

    _validate_file(file, file_size_mb)

    ext = Path(file.filename).suffix.lower()
    stored_filename = f"{uuid.uuid4()}{ext}"
    file_path = upload_dir / stored_filename

    with open(file_path, "wb") as f:
        f.write(contents)

    duration = _get_duration_seconds(str(file_path))

    video = Video(
        owner_id=owner.id,
        filename=file.filename,
        title=title,
        description=description,
        stored_filename=stored_filename,
        file_path=str(file_path),
        file_size_mb=round(file_size_mb, 2),
        content_type=file.content_type,
        duration_seconds=duration,
        status=VideoStatus.PROCESSING,
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    process_video(video)
    db.commit()
    db.refresh(video)

    return video


def list_user_videos(db: Session, owner: User) -> list[Video]:
    return db.query(Video).filter(Video.owner_id == owner.id).order_by(Video.created_at.desc()).all()


def get_video_or_404(db: Session, video_id: uuid.UUID, owner: User) -> Video:
    video = db.query(Video).filter(Video.id == video_id, Video.owner_id == owner.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return video