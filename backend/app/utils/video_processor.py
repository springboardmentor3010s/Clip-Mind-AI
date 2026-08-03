import os
import subprocess


def extract_audio(video_path: str):
    """
    Extract audio from uploaded video.
    """

    filename = os.path.splitext(
        os.path.basename(video_path)
    )[0]

    output_audio = os.path.join(
        "processed",
        "audio",
        filename + ".wav",
    )

    os.makedirs(
        os.path.dirname(output_audio),
        exist_ok=True,
    )

    command = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        "-i",
        video_path,
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        output_audio,
        "-y",
    ]

    # subprocess.run(command)
    result = subprocess.run(
    command,
    capture_output=True,
    text=True
)

    print(result.stdout)
    print(result.stderr)

    return output_audio