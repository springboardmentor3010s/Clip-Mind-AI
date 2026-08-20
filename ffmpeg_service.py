"""
FFmpeg service: video processing using local FFmpeg binaries.
Uses ffmpeg.exe and ffprobe.exe directly from backend/ffmpeg/bin/ via subprocess.
"""
import json
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

FFMPEG = BASE_DIR / "ffmpeg" / "bin" / "ffmpeg.exe"
FFPROBE = BASE_DIR / "ffmpeg" / "bin" / "ffprobe.exe"

UPLOADS = BASE_DIR / "app" / "uploads"
AUDIO = BASE_DIR / "audio"
THUMBNAILS = BASE_DIR / "thumbnails"

AUDIO.mkdir(exist_ok=True)
THUMBNAILS.mkdir(exist_ok=True)


class FFmpegService:

    def __init__(self):
        """Instantiate FFmpegService — checks that binaries are available."""
        self.check_ffmpeg()

    # ----------------------------------------------------------------
    # Instance method: extract audio to a specified output directory
    # ----------------------------------------------------------------

    def extract_audio(self, video_path: str, output_dir: str = None) -> str:
        """
        Extract audio from a video file as 16kHz mono WAV.

        Args:
            video_path: Path to the video file.
            output_dir: Directory to save the WAV file.
                If None, defaults to backend/audio/.

        Returns:
            Path to the extracted audio file.
        """
        dest = Path(output_dir) if output_dir else AUDIO
        dest.mkdir(parents=True, exist_ok=True)

        audio_path = dest / (Path(video_path).stem + ".wav")

        cmd = [
            str(FFMPEG),
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
            str(audio_path),
        ]

        subprocess.run(cmd, check=True)

        return str(audio_path)

    # ----------------------------------------------------------------
    # Static utility methods
    # ----------------------------------------------------------------

    @staticmethod
    def check_ffmpeg():
        """Verify that local FFmpeg binaries exist."""
        if not FFMPEG.exists():
            raise FileNotFoundError(
                f"FFmpeg not found: {FFMPEG}"
            )

        if not FFPROBE.exists():
            raise FileNotFoundError(
                f"FFprobe not found: {FFPROBE}"
            )

    @staticmethod
    def get_video_info(video_path: str) -> dict:
        """
        Extract full video metadata (format + streams) using ffprobe.

        Args:
            video_path: Path to the video file.

        Returns:
            Dictionary with format and stream information.
        """
        FFmpegService.check_ffmpeg()

        cmd = [
            str(FFPROBE),
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            video_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
        )

        return json.loads(result.stdout)

    @staticmethod
    def extract_audio(video_path: str) -> str:
        """
        Extract audio from a video file as 16kHz mono WAV.

        Args:
            video_path: Path to the video file.

        Returns:
            Path to the extracted audio file.
        """
        FFmpegService.check_ffmpeg()

        audio_path = AUDIO / (Path(video_path).stem + ".wav")

        cmd = [
            str(FFMPEG),
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
            str(audio_path),
        ]

        subprocess.run(cmd, check=True)

        return str(audio_path)

    @staticmethod
    def generate_thumbnail(video_path: str) -> str:
        """
        Generate a thumbnail image from a video at the 3-second mark.

        Args:
            video_path: Path to the video file.

        Returns:
            Path to the generated thumbnail image.
        """
        thumbnail = THUMBNAILS / (Path(video_path).stem + ".jpg")
        return FFmpegService.generate_thumbnail_to(video_path, str(thumbnail))

    @staticmethod
    def generate_thumbnail_to(video_path: str, output_path: str) -> str:
        """
        Generate a thumbnail image from a video at the 3-second mark and
        write it directly to a specific output path (avoids a temp copy).

        Args:
            video_path: Path to the video file.
            output_path: Desired output path for the JPG thumbnail.

        Returns:
            The output_path string on success.

        Raises:
            FileNotFoundError: If FFmpeg is not found.
            subprocess.CalledProcessError: If FFmpeg fails to generate.
        """
        FFmpegService.check_ffmpeg()

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            str(FFMPEG),
            "-y",
            "-i",
            video_path,
            "-ss",
            "00:00:03",
            "-frames:v",
            "1",
            str(output),
        ]

        subprocess.run(cmd, check=True)

        return str(output)

    @staticmethod
    def get_duration(video_path: str) -> float:
        """
        Get the duration of a video in seconds.

        Args:
            video_path: Path to the video file.

        Returns:
            Duration in seconds.
        """
        info = FFmpegService.get_video_info(video_path)
        return float(info["format"]["duration"])

    @staticmethod
    def get_file_size(video_path: str) -> int:
        """
        Get the file size of a video in bytes.

        Args:
            video_path: Path to the video file.

        Returns:
            File size in bytes.
        """
        return Path(video_path).stat().st_size

    @staticmethod
    def is_ffmpeg_available() -> bool:
        """
        Check whether FFmpeg and FFprobe binaries are present on disk.

        Returns:
            True if both binaries exist, False otherwise.
        """
        return FFMPEG.exists() and FFPROBE.exists()

    @staticmethod
    def extract_audio_to(video_path: str, output_path: str) -> str:
        """
        Extract audio from a video file and save to a specific output path.

        Args:
            video_path: Path to the video file.
            output_path: Desired output path for the WAV file.

        Returns:
            The output_path string on success.

        Raises:
            FileNotFoundError: If FFmpeg is not found.
            subprocess.CalledProcessError: If FFmpeg extraction fails.
        """
        FFmpegService.check_ffmpeg()

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            str(FFMPEG),
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
            str(output),
        ]

        subprocess.run(cmd, check=True)

        return str(output)
