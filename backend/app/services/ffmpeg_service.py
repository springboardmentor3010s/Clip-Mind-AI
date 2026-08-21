import json
import os
import subprocess


AUDIO_FOLDER = "uploads/audio"

os.makedirs(
    AUDIO_FOLDER,
    exist_ok=True
)


# On Windows (local dev), set these in your .env file, e.g.:
#   FFMPEG_PATH=C:\Users\saisa\Downloads\ffmpeg-8.1.2-essentials_build\ffmpeg-8.1.2-essentials_build\bin\ffmpeg.exe
#   FFPROBE_PATH=C:\Users\saisa\Downloads\ffmpeg-8.1.2-essentials_build\ffmpeg-8.1.2-essentials_build\bin\ffprobe.exe
#
# In Docker (Linux), leave them unset (or set to "ffmpeg" / "ffprobe") so the
# binaries installed in the image via PATH are used instead.
FFMPEG_PATH = os.environ.get("FFMPEG_PATH", "ffmpeg")
FFPROBE_PATH = os.environ.get("FFPROBE_PATH", "ffprobe")


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