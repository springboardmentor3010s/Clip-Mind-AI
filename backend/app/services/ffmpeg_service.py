import json
import os
import subprocess


AUDIO_FOLDER = "uploads/audio"

os.makedirs(
    AUDIO_FOLDER,
    exist_ok=True
)


FFMPEG_PATH = (
    r"C:\Users\saisa\Downloads"
    r"\ffmpeg-8.1.2-essentials_build"
    r"\ffmpeg-8.1.2-essentials_build"
    r"\bin\ffmpeg.exe"
)


FFPROBE_PATH = (
    r"C:\Users\saisa\Downloads"
    r"\ffmpeg-8.1.2-essentials_build"
    r"\ffmpeg-8.1.2-essentials_build"
    r"\bin\ffprobe.exe"
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

        FFMPEG_PATH,

        "-hide_banner",

        "-loglevel",
        "error",

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

        audio_path

    ]

    subprocess.run(
        command,
        check=True
    )

    return audio_path


def get_video_duration(
    video_path: str
):

    command = [

        FFPROBE_PATH,

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

    data = json.loads(
        result.stdout
    )

    seconds = float(
        data["format"]["duration"]
    )

    minutes = int(
        seconds // 60
    )

    secs = int(
        seconds % 60
    )

    return (
        f"{minutes:02}:{secs:02}"
    )