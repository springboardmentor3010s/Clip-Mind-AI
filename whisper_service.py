"""
Whisper service: speech-to-text transcription using OpenAI Whisper.
"""
import logging
import os
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)


class WhisperService:
    """
    Service for speech-to-text transcription using OpenAI Whisper.
    """

    def __init__(self, model_name: str = "base"):
        """
        Available models:
        tiny, base, small, medium, large
        """
        logger.info(f"Loading Whisper model: {model_name}")
        try:
            import whisper
            self.model = whisper.load_model(model_name)
        except ImportError:
            logger.error("Whisper not installed. Install with: pip install openai-whisper")
            raise
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise

    def _validate_audio(self, audio_path: str) -> None:
        """
        Validate that the audio file exists, is non-empty, and contains valid WAV data.

        Raises:
            FileNotFoundError: If file doesn't exist.
            ValueError: If file is empty or has no audio samples.
        """
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        file_size = path.stat().st_size
        if file_size == 0:
            raise ValueError(
                f"Audio file is empty (0 bytes): {audio_path}. "
                "The video may have no audio track or audio extraction failed."
            )

        if file_size < 44:  # WAV header minimum size
            raise ValueError(
                f"Audio file is too small ({file_size} bytes) to be a valid WAV: {audio_path}"
            )

        # Try to load the audio and verify it has samples using Whisper's audio backend
        try:
            import whisper.audio as whisper_audio
            audio = whisper_audio.load_audio(audio_path)
            if audio is None or len(audio) == 0:
                raise ValueError(
                    f"Audio file loaded 0 samples: {audio_path}. "
                    "The file may be corrupted or the video has no audio stream."
                )
            logger.info(
                f"Audio validated: {audio_path} ({len(audio)} samples, "
                f"{len(audio) / 16000:.1f}s at 16kHz)"
            )
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(
                f"Failed to load audio from {audio_path}: {e}. "
                "The audio file may be corrupted or in an unsupported format."
            ) from e

    def transcribe_audio(self, audio_path: str) -> dict:
        """
        Transcribe an audio file.

        Args:
            audio_path (str): Path to WAV/MP3 audio file.

        Returns:
            dict: Whisper transcription result.
        """
        # Validate audio file before passing to Whisper
        self._validate_audio(audio_path)

        logger.info(f"Transcribing audio: {audio_path}")

        try:
            result = self.model.transcribe(
                audio_path,
                fp16=False
            )
        except RuntimeError as e:
            error_str = str(e)
            # Catch the common "0-element tensor" reshape error from Whisper
            if "cannot reshape tensor of 0 elements" in error_str:
                raise RuntimeError(
                    f"Whisper encountered empty audio data: {audio_path}. "
                    "The video may not have a valid audio track. "
                    "Please verify the video file has audio and try again."
                ) from e
            # Catch other Whisper/PyTorch runtime errors
            raise RuntimeError(
                f"Whisper transcription failed for {audio_path}: {error_str}"
            ) from e

        return {
            "language": result.get("language"),
            "text": result.get("text"),
            "segments": result.get("segments", [])
        }

    def get_plain_text(self, audio_path: str) -> str:
        """
        Return transcript text only.
        """
        result = self.transcribe_audio(audio_path)
        return result["text"]

    def get_segments(self, audio_path: str):
        """
        Return timestamp segments.
        """
        result = self.transcribe_audio(audio_path)
        return result["segments"]