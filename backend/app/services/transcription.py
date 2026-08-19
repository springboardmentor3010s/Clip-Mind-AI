import subprocess
import os
import tempfile
import time
import logging

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except Exception as e:
    logging.getLogger(__name__).warning(f"Could not import or initialize static_ffmpeg: {e}")

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from transformers import pipeline
import uuid
from app.services.r2_storage import get_s3_client
from app.core.config import settings
from app.models.transcript import Transcript
from app.models.video import Video, VideoStatus
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

# Initialize whisper pipeline
try:
    whisper_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-tiny", return_timestamps=True)
except Exception as e:
    logger.error(f"Failed to load Whisper model: {e}")
    whisper_pipeline = None

def download_video_from_r2(s3_key: str, local_path: str):
    """Downloads the video file from R2 to a local temp path."""
    s3_client = get_s3_client()
    s3_client.download_file(settings.r2_bucket_name, s3_key, local_path)

def extract_audio(video_path: str, audio_path: str) -> bool:
    """Extracts 16kHz mono audio from video using FFmpeg. Returns True if audio stream exists, False if silent."""
    command = [
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path
    ]
    res = subprocess.run(command, capture_output=True, text=True)
    if res.returncode != 0:
        stderr_text = res.stderr or ""
        if "Output file does not contain any stream" in stderr_text or "does not contain any stream" in stderr_text:
            logger.info("Video file has no audio stream (silent/no-audio video).")
            return False
        logger.error(f"FFmpeg error:\n{stderr_text}")
        res.check_returncode()
    return True

def process_video_transcription(video_id: int):
    """Background task to transcribe video."""
    if not whisper_pipeline:
        logger.error("Whisper pipeline not loaded, cannot transcribe.")
        return

    db: Session = SessionLocal()
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or video.status != VideoStatus.UPLOADED:
        db.close()
        return

    # Update status
    video.status = VideoStatus.PROCESSING
    db.commit()

    start_time = time.monotonic()

    temp_dir = tempfile.gettempdir()
    temp_video_path = os.path.join(temp_dir, f"{uuid.uuid4()}.mp4")
    temp_audio_path = os.path.join(temp_dir, f"{uuid.uuid4()}.wav")

    try:
        logger.info(f"Downloading {video.s3_key} from R2 to {temp_video_path}...")
        download_video_from_r2(video.s3_key, temp_video_path)

        # Optional: update file size if not set
        if video.file_size_bytes == 0:
            video.file_size_bytes = os.path.getsize(temp_video_path)
            db.commit()

        # Step 2: Extract Audio
        logger.info(f"Extracting audio to {temp_audio_path}...")
        has_audio = extract_audio(temp_video_path, temp_audio_path)

        full_text = ""
        segments = []

        if not has_audio:
            logger.info(f"Video ID {video_id} contains no audio stream. Generating empty transcript.")
        else:
            # Step 3: Run Whisper
            logger.info("Running Whisper transcription...")
            result = whisper_pipeline(temp_audio_path)
            
            full_text = result.get("text", "")
            chunks = result.get("chunks", [])
            
            for idx, chunk in enumerate(chunks):
                timestamp = chunk.get("timestamp", (0, 0))
                start_t = timestamp[0] if timestamp[0] is not None else 0
                end_t = timestamp[1] if timestamp[1] is not None else start_t + 5
                text_content = chunk.get("text", "").strip()
                segments.append({
                    "id": str(idx + 1),
                    "start_time": start_t,
                    "end_time": end_t,
                    "text": text_content
                })

        # Update video duration based on last segment
        if segments and video.duration_seconds == 0:
            video.duration_seconds = int(segments[-1]["end_time"])

        # Step 4: Save to DB
        transcript = Transcript(
            video_id=video_id,
            text=full_text,
            segments=segments
        )
        db.add(transcript)

        # Auto-title from the transcript, but only if the user hasn't already
        # renamed the video away from its default (upload-time) title.
        if full_text.strip() and video.title == video.filename:
            try:
                from app.services.key_moments import generate_title_from_text
                generated_title = generate_title_from_text(full_text)
                if generated_title:
                    video.title = generated_title
            except Exception as e:
                logger.error(f"Failed to auto-generate title for video {video_id}: {e}")

        video.status = VideoStatus.COMPLETED
        db.commit()
        logger.info(f"Transcription complete for video {video_id}.")

        elapsed_seconds = time.monotonic() - start_time
        try:
            from app.models.analytics import AnalyticsEvent
            db.add(AnalyticsEvent(video_id=video_id, event_type="processing_time", metadata_val=str(elapsed_seconds)))
            db.commit()
        except Exception as e:
            logger.error(f"Failed to track processing time for video {video_id}: {e}")

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        video.status = VideoStatus.FAILED
        db.commit()
    finally:
        # Cleanup temp files
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)
        db.close()
