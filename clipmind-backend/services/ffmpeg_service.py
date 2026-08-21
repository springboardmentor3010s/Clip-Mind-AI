import json
import shutil
import subprocess


class FFmpegNotFoundError(RuntimeError):
    pass


def _check_binary(name: str):
    if shutil.which(name) is None:
        raise FFmpegNotFoundError(
            f"'{name}' was not found on PATH. Install FFmpeg (see README) and restart the backend."
        )


def probe_duration_seconds(file_path: str) -> float:
    """Return media duration in seconds using ffprobe. Falls back to 0 on failure."""
    _check_binary("ffprobe")
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "json", file_path,
            ],
            capture_output=True, text=True, timeout=60, check=True,
        )
        data = json.loads(result.stdout or "{}")
        duration = float(data.get("format", {}).get("duration", 0) or 0)
        return max(0.0, duration)
    except Exception:
        return 0.0


def extract_audio(input_path: str, output_wav_path: str) -> str:
    """
    Extract mono 16kHz PCM WAV audio from the input media file.
    This is the format whisper/faster-whisper expects for best results.
    """
    _check_binary("ffmpeg")
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-acodec", "pcm_s16le",
        output_wav_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr[-2000:]}")
    return output_wav_path
