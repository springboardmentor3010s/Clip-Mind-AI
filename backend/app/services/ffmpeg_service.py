import os
import subprocess
import json

AUDIO_FOLDER = "uploads/audio"

os.makedirs(
    AUDIO_FOLDER,
    exist_ok=True
)


def extract_audio(video_path: str):
    filename = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    audio_path = os.path.join(
        AUDIO_FOLDER,
        f"{filename}.wav"
    )

    command = [
        r"C:\Users\saisa\Downloads\ffmpeg-8.1.2-essentials_build\ffmpeg-8.1.2-essentials_build\bin\ffmpeg.exe",
        "-y",
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
    ]

    subprocess.run(
        command,
        check=True
    )

    return audio_path


def get_video_duration(video_path: str):
    command = [
        "ffprobe",
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        video_path
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=True
    )

    data = json.loads(result.stdout)

    seconds = float(
        data["format"]["duration"]
    )

    minutes = int(seconds // 60)
    secs = int(seconds % 60)

    return f"{minutes:02}:{secs:02}"