"""
FFmpeg-based video processing pipeline.
Extracts video duration, generates a thumbnail image, and extracts audio.
"""

import subprocess
import json
import os
from app.core.config import settings


def get_video_duration(file_path: str) -> int | None:
    """
    Uses ffprobe (comes bundled with ffmpeg) to read the video duration in seconds.
    """
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "json",
                file_path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        data = json.loads(result.stdout)
        duration = float(data["format"]["duration"])
        return round(duration)
    except Exception as e:
        print(f"[FFmpeg] Could not extract duration: {e}")
        return None


def generate_thumbnail(file_path: str, video_id: str) -> str | None:
    """
    Extracts a single frame at the 1-second mark (or 0s for very short clips)
    and saves it as a JPEG thumbnail.
    """
    try:
        os.makedirs(settings.THUMBNAIL_STORAGE_PATH, exist_ok=True)
        thumbnail_filename = f"{video_id}.jpg"
        thumbnail_path = os.path.join(settings.THUMBNAIL_STORAGE_PATH, thumbnail_filename)

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", file_path,
                "-ss", "00:00:01.000",
                "-vframes", "1",
                "-vf", "scale=320:-1",
                thumbnail_path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return thumbnail_path
    except Exception as e:
        print(f"[FFmpeg] Could not generate thumbnail: {e}")
        return None


def extract_audio(file_path: str, video_id: str) -> str | None:
    """
    Extracts the audio track from a video and saves it as an MP3 file.
    """
    try:
        audio_dir = os.path.join(settings.LOCAL_STORAGE_PATH, "audio")
        os.makedirs(audio_dir, exist_ok=True)
        audio_filename = f"{video_id}.mp3"
        audio_path = os.path.join(audio_dir, audio_filename)

        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", file_path,
                "-vn",
                "-acodec", "libmp3lame",
                "-q:a", "2",
                audio_path,
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        return audio_path
    except Exception as e:
        print(f"[FFmpeg] Could not extract audio: {e}")
        return None


def process_video(file_path: str, video_id: str) -> dict:
    """
    Runs the full Milestone 1 processing step: duration + thumbnail.
    Returns a dict the upload route can use to update the database record.
    """
    duration = get_video_duration(file_path)
    thumbnail_path = generate_thumbnail(file_path, video_id)

    return {
        "duration_seconds": duration,
        "thumbnail_url": thumbnail_path,
    }