import json
import os

from sqlalchemy.orm import Session

from models.db_models import Video
from services import (
    ffmpeg_service,
    whisper_service,
    nlp_service,
    moments_service,
    analytics_service,
)
from services.time_utils import fmt
import config


def run_transcription(db: Session, video: Video) -> Video:
    """Extract audio (if needed) and run Whisper, persisting results on the Video row."""
    try:
        print(">>> PIPELINE: transcription started", flush=True)

        video.status = "Processing"
        db.commit()

        print(">>> PIPELINE: checking audio file", flush=True)

        audio_path = video.audio_path

        if not audio_path or not os.path.exists(audio_path):
            print(">>> PIPELINE: audio not found, extracting with FFmpeg", flush=True)

            audio_path = os.path.join(
                config.AUDIO_DIR,
                f"{video.id}.wav",
            )

            print(
                f">>> PIPELINE: extracting audio to {audio_path}",
                flush=True,
            )

            ffmpeg_service.extract_audio(
                video.file_path,
                audio_path,
            )

            print(">>> PIPELINE: audio extraction finished", flush=True)

            video.audio_path = audio_path
            db.commit()

        else:
            print(
                f">>> PIPELINE: existing audio found at {audio_path}",
                flush=True,
            )

        print(">>> PIPELINE: calling Whisper", flush=True)

        segments, language_label = whisper_service.transcribe(
            audio_path
        )

        print(">>> PIPELINE: Whisper finished", flush=True)

        video.transcript_json = json.dumps(
            segments,
            ensure_ascii=False,
        )

        video.language = language_label

        if segments:
            video.duration_seconds = max(
                video.duration_seconds,
                segments[-1]["seconds"],
            )

        video.status = "Processing"

        db.commit()
        db.refresh(video)

        print(
            f">>> PIPELINE: transcription complete - "
            f"{len(segments)} segments",
            flush=True,
        )

        return video

    except Exception as e:  # noqa: BLE001
        print(
            f">>> PIPELINE ERROR: {type(e).__name__}: {e}",
            flush=True,
        )

        video.status = "Failed"
        video.error = str(e)

        db.commit()

        raise


def run_summary(db: Session, video: Video) -> Video:
    print(">>> PIPELINE: generating summary", flush=True)

    segments = json.loads(
        video.transcript_json or "[]"
    )

    full_text = " ".join(
        s["text"] for s in segments
    )

    summary = nlp_service.build_summary(
        video.title,
        fmt(video.duration_seconds),
        full_text,
    )

    video.summary_json = json.dumps(
        summary,
        ensure_ascii=False,
    )

    db.commit()
    db.refresh(video)

    print(">>> PIPELINE: summary complete", flush=True)

    return video


def run_moments(db: Session, video: Video) -> Video:
    print(">>> PIPELINE: generating moments", flush=True)

    segments = json.loads(
        video.transcript_json or "[]"
    )

    moments = moments_service.build_moments(
        segments,
        top_n=6,
    )

    video.moments_json = json.dumps(
        moments,
        ensure_ascii=False,
    )

    db.commit()
    db.refresh(video)

    print(">>> PIPELINE: moments complete", flush=True)

    return video


def run_analytics(db: Session, video: Video) -> Video:
    print(">>> PIPELINE: generating analytics", flush=True)

    segments = json.loads(
        video.transcript_json or "[]"
    )

    moments = json.loads(
        video.moments_json or "[]"
    )

    full_text = " ".join(
        s["text"] for s in segments
    )

    analytics = analytics_service.build_analytics(
        segments,
        moments,
        full_text,
    )

    video.analytics_json = json.dumps(
        analytics,
        ensure_ascii=False,
    )

    video.status = "Processed"

    db.commit()
    db.refresh(video)

    print(">>> PIPELINE: analytics complete", flush=True)

    return video


def run_full_pipeline(db: Session, video: Video) -> Video:
    """Run transcript -> summary -> moments -> analytics end to end for one video."""

    print(">>> PIPELINE: FULL PIPELINE STARTED", flush=True)

    run_transcription(db, video)

    run_summary(db, video)

    run_moments(db, video)

    run_analytics(db, video)

    print(">>> PIPELINE: FULL PIPELINE COMPLETE", flush=True)

    return video