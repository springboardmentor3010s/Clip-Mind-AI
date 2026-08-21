import subprocess
import json
import os


# ===========================
# Extract Metadata
# ===========================

def extract_video_metadata(video_path: str):
    """
    Extract metadata from a video using FFprobe.
    """

    command = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        video_path
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    metadata = json.loads(result.stdout)

    video_stream = next(
        stream for stream in metadata["streams"]
        if stream["codec_type"] == "video"
    )

    return {
        "duration": float(metadata["format"]["duration"]),
        "width": video_stream["width"],
        "height": video_stream["height"],
        "codec": video_stream["codec_name"]
    }


# ===========================
# Generate Thumbnail
# ===========================

def generate_thumbnail(video_path: str):
    """
    Generate thumbnail from uploaded video.
    """

    BASE_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )

    THUMBNAIL_DIR = os.path.join(
        BASE_DIR,
        "uploads",
        "thumbnails"
    )

    os.makedirs(THUMBNAIL_DIR, exist_ok=True)

    filename = os.path.splitext(
        os.path.basename(video_path)
    )[0] + ".jpg"

    thumbnail_path = os.path.join(
        THUMBNAIL_DIR,
        filename
    )

    command = [
        "ffmpeg",
        "-i", video_path,
        "-ss", "00:00:01",
        "-frames:v", "1",
        "-update", "1",
        "-y",
        thumbnail_path
    ]

    subprocess.run(command)

    return thumbnail_path


# ===========================
# Compress Video
# ===========================

def compress_video(video_path: str):
    """
    Compress uploaded video using FFmpeg.
    """

    BASE_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )

    COMPRESSED_DIR = os.path.join(
        BASE_DIR,
        "uploads",
        "compressed"
    )

    os.makedirs(COMPRESSED_DIR, exist_ok=True)

    filename = os.path.basename(video_path)

    output_path = os.path.join(
        COMPRESSED_DIR,
        filename
    )

    command = [
        "ffmpeg",
        "-i", video_path,
        "-vcodec", "libx264",
        "-crf", "28",
        "-preset", "fast",
        "-acodec", "aac",
        "-b:a", "128k",
        "-y",
        output_path
    ]

    subprocess.run(command)

    return output_path