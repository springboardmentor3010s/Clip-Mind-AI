import subprocess
import json
import shutil
import os


def get_video_metadata(video_path: str):

    ffprobe_path = shutil.which("ffprobe")

    if ffprobe_path is None:
        raise Exception("FFprobe not found")

    command = [
        ffprobe_path,
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        video_path
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=True
    )

    return json.loads(result.stdout)


def extract_audio(video_path: str):

    ffmpeg_path = shutil.which("ffmpeg")

    if ffmpeg_path is None:
        raise Exception("FFmpeg not found")

    os.makedirs("audio", exist_ok=True)

    filename = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    audio_path = os.path.join(
        "audio",
        f"{filename}.wav"
    )

    command = [
        ffmpeg_path,
        "-i",
        video_path,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        audio_path,
        "-y"
    ]

    subprocess.run(
        command,
        check=True
    )

    return audio_path

def generate_thumbnail(video_path: str):

    ffmpeg_path = shutil.which("ffmpeg")

    if ffmpeg_path is None:
        raise Exception("FFmpeg not found")

    os.makedirs("thumbnails", exist_ok=True)

    filename = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    thumbnail_path = os.path.join(
        "thumbnails",
        f"{filename}.jpg"
    )

    command = [
        ffmpeg_path,
        "-i",
        video_path,
        "-ss",
        "00:00:02",
        "-frames:v",
        "1",
        thumbnail_path,
        "-y"
    ]

    subprocess.run(
        command,
        check=True
    )

    return thumbnail_path