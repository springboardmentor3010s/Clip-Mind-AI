"""
Transcript service: coordinates audio extraction, Whisper transcription,
and transcript persistence in PostgreSQL.
"""
import json
import os
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transcript import Transcript
from app.models.video import Video
from app.services.ffmpeg_service import FFmpegService
from app.services.whisper_service import WhisperService

logger = logging.getLogger(__name__)

# Default directories
AUDIO_DIR = os.path.join(settings.UPLOAD_DIR, "audio")


class TranscriptService:
    """
    Service for generating and managing video transcripts.

    Coordinates the full pipeline:
        FFmpegService (extract audio) -> WhisperService (transcribe) -> DB (save)

    Usage:
        service = TranscriptService()
        transcript = service.generate_transcript(db, video)
    """

    def __init__(self, whisper_model_name: str = "base"):
        self.ffmpeg = FFmpegService()
        self.whisper = WhisperService(model_name=whisper_model_name)
        os.makedirs(AUDIO_DIR, exist_ok=True)

    # ----------------------------------------------------------------
    # Public API
    # ----------------------------------------------------------------

    def generate_transcript(self, video_path: str) -> dict:
        """
        Generate transcript from a video file.

        Steps:
          1. Extract audio from video (FFmpegService).
          2. Transcribe audio (WhisperService).
          3. Return structured transcript dict.

        Args:
            video_path: Path to the video file (e.g. "app/uploads/videos/sample.mp4").

        Returns:
            dict: {
                "video_path": ...,
                "audio_path": ...,
                "language": ...,
                "transcript": ...,
                "segments": [...]
            }
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        # Step 1: Extract audio
        logger.info(f"Extracting audio from: {video_path}")
        audio_path = self.ffmpeg.extract_audio(
            video_path=video_path,
            output_dir=AUDIO_DIR,
        )

        # Step 2: Generate transcript
        logger.info(f"Transcribing audio: {audio_path}")
        result = self.whisper.transcribe_audio(audio_path)

        transcript = {
            "video_path": video_path,
            "audio_path": audio_path,
            "language": result.get("language"),
            "transcript": result.get("text", "").strip(),
            "segments": [
                {
                    "id": idx,
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", "").strip(),
                }
                for idx, seg in enumerate(result.get("segments", []))
            ],
        }

        logger.info(f"Transcript generated successfully for: {video_path}")
        return transcript

    # ----------------------------------------------------------------
    # Database-aware methods (for existing endpoints)
    # ----------------------------------------------------------------

    def generate_and_save(
        self, db: Session, video: Video
    ) -> Transcript:
        """
        Full pipeline: ensure audio -> transcribe -> persist in PostgreSQL.

        Args:
            db: Database session.
            video: Video model instance (must have id, user_id, file_path, etc.).

        Returns:
            Transcript: The created transcript record.
        """
        self._ensure_audio_exists(db, video)

        if video.transcript is not None:
            raise ValueError("Transcript already exists for this video")

        # Transcribe via Whisper
        logger.info(
            f"Starting transcription for video {video.id}, "
            f"audio_path={video.audio_path}"
        )
        transcription_result = self.whisper.transcribe_audio(video.audio_path)
        logger.info(f"Transcription completed for video {video.id}")

        # Build confidence from segments
        segments = transcription_result.get("segments", [])
        confidence = None
        if segments:
            confidences = [
                s.get("confidence", 0) for s in segments
                if s.get("confidence") is not None
            ]
            if confidences:
                confidence = int(sum(confidences) / len(confidences) * 100)

        # Normalize segments for storage (keep only essential fields)
        stored_segments = [
            {
                "id": seg.get("id", idx),
                "start": seg.get("start", 0),
                "end": seg.get("end", 0),
                "text": seg.get("text", "").strip(),
            }
            for idx, seg in enumerate(segments)
        ]

        # Persist
        transcript = Transcript(
            video_id=video.id,
            transcript=transcription_result["text"].strip(),
            language=transcription_result.get("language", "en"),
            confidence=confidence,
            segments=stored_segments,
        )
        db.add(transcript)

        video.status = "transcripted"
        db.add(video)

        db.commit()
        db.refresh(transcript)
        return transcript

    def get_transcript(self, db: Session, video: Video) -> Optional[Transcript]:
        """Return the transcript for a video, or None."""
        return video.transcript

    def update_transcript(
        self,
        db: Session,
        video: Video,
        transcript_text: Optional[str] = None,
        language: Optional[str] = None,
        confidence: Optional[int] = None,
    ) -> Transcript:
        """Update an existing transcript's fields."""
        transcript = video.transcript
        if transcript is None:
            raise ValueError("Transcript not found for this video")

        if transcript_text is not None:
            transcript.transcript = transcript_text
        if language is not None:
            transcript.language = language
        if confidence is not None:
            transcript.confidence = confidence

        db.add(transcript)
        db.commit()
        db.refresh(transcript)
        return transcript

    # ----------------------------------------------------------------
    # Audio resolution helpers
    # ----------------------------------------------------------------

    def _ensure_audio_exists(self, db: Session, video: Video) -> None:
        """
        Make sure an audio file is available for the video.

        Tries:
          1. Check if audio_path already points to an existing file.
          2. Scan upload directory for a matching .wav file.
          3. Extract audio from the original video file on-the-fly.
        """
        if video.audio_path and os.path.exists(video.audio_path):
            logger.info(f"Audio already exists for video {video.id}")
            return

        upload_dir = os.path.join(settings.UPLOAD_DIR, str(video.user_id))

        # Fallback 1: scan for existing .wav
        if self._scan_for_audio(video, upload_dir):
            db.add(video)
            db.commit()
            db.refresh(video)
            return

        # Fallback 2: extract on-the-fly
        self._extract_on_the_fly(video, upload_dir)
        db.add(video)
        db.commit()
        db.refresh(video)

    def _scan_for_audio(self, video: Video, upload_dir: str) -> bool:
        """Look for a matching .wav file in the upload directory."""
        if not os.path.isdir(upload_dir):
            return False

        wav_files = [f for f in os.listdir(upload_dir) if f.endswith(".wav")]
        if not wav_files:
            return False

        video_stem = video.filename.rsplit(".", 1)[0] if video.filename else ""
        matched = [f for f in wav_files if f.startswith(video_stem)]
        chosen = matched[0] if matched else wav_files[0]

        wav_path = os.path.join(upload_dir, chosen)
        if os.path.exists(wav_path):
            logger.info(f"Found existing audio: {wav_path}. Updating DB.")
            video.audio_path = wav_path
            return True

        return False

    def _extract_on_the_fly(self, video: Video, upload_dir: str) -> None:
        """Extract audio from the original video using FFmpegService."""
        if not FFmpegService.is_ffmpeg_available():
            raise RuntimeError(
                "FFmpeg is not available. "
                "Please install FFmpeg to enable transcript generation."
            )

        if not video.file_path or not os.path.exists(video.file_path):
            raise FileNotFoundError(
                "Video file not found. Cannot extract audio."
            )

        audio_filename = video.filename.rsplit(".", 1)[0] + ".wav"
        audio_path = os.path.join(upload_dir, audio_filename)

        try:
            FFmpegService.extract_audio_to(video.file_path, audio_path)
        except Exception as e:
            raise RuntimeError(
                f"Failed to extract audio from video: {e}"
            ) from e

        video.audio_path = audio_path
        logger.info(f"Audio extracted on-the-fly: {audio_path}")

