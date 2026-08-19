"""
Background video-processing pipeline for ClipMind AI (Celery task).

Both YouTube URLs and uploaded files converge on ONE pipeline:

  1. Obtain a local source video
       - Upload  : the file the user uploaded.
       - YouTube : download the full video with yt-dlp (android player client,
                   which bypasses the "not available on this app" restriction).
  2. Compress + store locally (H.264 720p / CRF 28 / AAC / faststart) so the
     frontend can play it and seek reliably, while keeping storage manageable.
  3. Extract audio (FFmpeg) -> transcribe (Whisper large-v3, language auto-detected).
  4. Generate a study-grade AI summary + key moments.
  5. Render a thumbnail frame for each key moment (for the Key Moments player).

YouTube therefore behaves identically to an uploaded video after step 1.
"""
import os
import re
import json
import glob
import logging
import subprocess
import traceback

from celery import shared_task
from django.conf import settings
from django.core.files import File

import yt_dlp
import imageio_ffmpeg

from apps.videos.models import Video
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary, KeyMoment
from apps.accounts.models import ActivityLog
from core.logging_service import record_activity
from services.ai.provider_manager import get_ai_provider

logger = logging.getLogger("celery")

_YT_ID_RE = re.compile(r"(?:v=|/shorts/|youtu\.be/|/embed/|/v/)([A-Za-z0-9_-]{11})")
_DURATION_RE = re.compile(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)")

# Compression target: cap width at 1280px (≈720p for 16:9), re-encode H.264/AAC.
_COMPRESS_CRF = "28"
_COMPRESS_MAX_WIDTH = 1280


def _ffmpeg() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def extract_youtube_id(url: str) -> str:
    match = _YT_ID_RE.search(url or "")
    return match.group(1) if match else ""


# --------------------------------------------------------------------------- #
# Media helpers
# --------------------------------------------------------------------------- #
def download_youtube_video(url: str, output_path_no_ext: str) -> dict:
    """
    Download the full YouTube video (video+audio, merged to mp4).

    Uses the 'android' player client, which currently avoids the
    "The following content is not available on this app" error that the
    default/web/tv clients hit. Returns {path, title, thumbnail, youtube_id, duration}.
    """
    logger.info("Downloading YouTube video: %s", url)
    ydl_opts = {
        "format": "bv*+ba/b",
        "merge_output_format": "mp4",
        "outtmpl": output_path_no_ext + ".%(ext)s",
        "ffmpeg_location": _ffmpeg(),
        "quiet": True,
        "no_warnings": True,
        # Client that bypasses YouTube's app-restriction error.
        "extractor_args": {"youtube": {"player_client": ["android"]}},
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)

    # Locate the actual downloaded file (extension may vary before/after merge).
    candidates = sorted(
        glob.glob(output_path_no_ext + ".*"),
        key=lambda p: (p.endswith(".mp4"), os.path.getsize(p)),
        reverse=True,
    )
    if not candidates:
        raise RuntimeError("YouTube download produced no file.")
    return {
        "path": candidates[0],
        "title": info.get("title", ""),
        "thumbnail": info.get("thumbnail", ""),
        "youtube_id": info.get("id", ""),
        "duration": float(info.get("duration") or 0.0),
    }


def compress_video(src_path: str, dst_path: str) -> str:
    """
    Re-encode to a web-friendly, storage-efficient MP4:
    H.264 (CRF 28), max width 1280 (downscale only), AAC 128k, +faststart.
    """
    logger.info("Compressing video: %s -> %s", src_path, dst_path)
    scale = f"scale='min({_COMPRESS_MAX_WIDTH},iw)':-2"
    cmd = [
        _ffmpeg(), "-y", "-i", src_path,
        "-vf", scale,
        "-c:v", "libx264", "-crf", _COMPRESS_CRF, "-preset", "veryfast",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        dst_path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return dst_path


def extract_audio_from_file(video_path: str, output_path: str) -> str:
    """Extract a 16kHz mono MP3 audio track (ideal for Whisper) using FFmpeg."""
    logger.info("Extracting audio from: %s", video_path)
    cmd = [
        _ffmpeg(), "-y", "-i", video_path,
        "-vn", "-acodec", "libmp3lame", "-ar", "16000", "-ac", "1",
        output_path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return output_path


def get_media_duration(path: str) -> float:
    """Return media duration in seconds by parsing FFmpeg's output."""
    proc = subprocess.run([_ffmpeg(), "-i", path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    match = _DURATION_RE.search(proc.stderr.decode("utf-8", "ignore"))
    if match:
        h, m, s = match.groups()
        return int(h) * 3600 + int(m) * 60 + float(s)
    return 0.0


def generate_thumbnail(video_path: str, timestamp: float, dst_path: str, duration: float = 0.0) -> str | None:
    """Capture a single frame at `timestamp` as a JPEG. Returns dst_path or None."""
    ts = max(0.0, timestamp)
    if duration and ts > duration - 0.5:
        ts = max(0.0, duration - 1.0)
    cmd = [
        _ffmpeg(), "-y", "-ss", str(ts), "-i", video_path,
        "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3",
        dst_path,
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return dst_path if os.path.exists(dst_path) else None
    except subprocess.CalledProcessError as exc:
        logger.warning("Thumbnail generation failed at %.1fs: %s", ts, exc)
        return None


# --------------------------------------------------------------------------- #
# Main pipeline
# --------------------------------------------------------------------------- #
def _set_progress(video: Video, progress: int, step: str) -> None:
    video.progress = progress
    video.current_step = step
    video.save(update_fields=["progress", "current_step", "updated_at"])


@shared_task(bind=True)
def process_video_task(self, video_id: str):
    """Source -> local compressed video -> transcript -> AI summary + key moments."""
    logger.info("Starting processing task for video_id: %s", video_id)
    try:
        video = Video.objects.get(id=video_id)
    except Video.DoesNotExist:
        logger.error("Video with id %s not found.", video_id)
        return

    temp_dir = os.path.join(settings.MEDIA_ROOT, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    base = os.path.join(temp_dir, str(video_id))
    downloaded_path = None          # raw yt-dlp download (temp)
    compressed_path = base + "_c.mp4"
    audio_file_path = base + ".mp3"

    try:
        video.status = Video.Status.PROCESSING
        video.celery_task_id = self.request.id or ""
        video.error_message = ""
        video.progress = 5
        video.current_step = "Preparing"
        video.save(update_fields=[
            "status", "celery_task_id", "error_message", "progress", "current_step", "updated_at",
        ])

        # -------- 1) Obtain a local source video -------- #
        if video.source_url and not video.video_file:
            _set_progress(video, 12, "Downloading Video")
            info = download_youtube_video(video.source_url, base + "_src")
            downloaded_path = info["path"]
            source_path = downloaded_path
            video.youtube_id = extract_youtube_id(video.source_url) or info["youtube_id"]
            if info["title"]:
                video.title = info["title"]
            if info["thumbnail"]:
                video.thumbnail_url = info["thumbnail"]
            video.save(update_fields=["youtube_id", "title", "thumbnail_url", "updated_at"])
        else:
            if not video.video_file:
                raise ValueError("No video file or YouTube URL provided.")
            if not video.title:
                video.title = os.path.basename(video.video_file.name)
                video.save(update_fields=["title", "updated_at"])
            source_path = video.video_file.path

        # -------- 2) Compress + store locally -------- #
        _set_progress(video, 30, "Optimizing Video")
        compress_video(source_path, compressed_path)

        # Capture the ORIGINAL name as a string BEFORE saving — FieldFile.save()
        # mutates the same object in place, so holding the FieldFile reference
        # would compare the new name to itself and never delete the original.
        old_name = video.video_file.name if video.video_file else ""
        storage = video.video_file.storage
        with open(compressed_path, "rb") as fh:
            video.video_file.save(f"{video_id}.mp4", File(fh), save=False)
        video.duration_seconds = get_media_duration(video.video_file.path)
        video.save(update_fields=["video_file", "duration_seconds", "updated_at"])
        # Reclaim storage: drop the original upload now that it has been replaced.
        if old_name and old_name != video.video_file.name:
            try:
                storage.delete(old_name)
            except Exception as exc:
                logger.warning("Could not delete original upload '%s': %s", old_name, exc)

        local_video_path = video.video_file.path

        # -------- 3) Extract audio + transcribe -------- #
        _set_progress(video, 45, "Extracting Audio")
        extract_audio_from_file(local_video_path, audio_file_path)

        _set_progress(video, 55, "Generating Transcript")
        provider = get_ai_provider()
        # Optional user-supplied source-language hint ("" -> auto-detect).
        stt = provider.transcribe(audio_file_path, language=video.source_language or None)
        transcript_text = stt.get("text", "")
        segments = stt.get("segments", [])
        detected_language = (stt.get("language") or "").strip() or "en"

        if not transcript_text or not transcript_text.strip():
            raise ValueError("Transcript could not be generated for this video.")

        Transcript.objects.update_or_create(
            video=video,
            defaults={
                "content": transcript_text,
                "segments": segments,
                "word_count": len(transcript_text.split()),
                "language": detected_language[:10],
            },
        )
        record_activity(
            video.user, ActivityLog.Action.TRANSCRIPT_GENERATED,
            description=video.title, target_id=video.id, target_type="video",
        )

        # -------- 4) AI summary -------- #
        _set_progress(video, 75, "Generating AI Summary")
        analysis = provider.analyze_transcript(transcript_text, title=video.title)
        summary_sections = {
            "short_summary": analysis.get("short_summary", ""),
            "detailed_summary": analysis.get("detailed_summary", ""),
            "bullet_summary": analysis.get("bullet_summary", []),
            "chapter_summary": analysis.get("chapter_summary", []),
            "important_topics": analysis.get("important_topics", []),
            "action_items": analysis.get("action_items", []),
            "glossary": analysis.get("glossary", []),
            "key_questions": analysis.get("key_questions", []),
        }
        Summary.objects.update_or_create(
            video=video,
            defaults={
                "content": json.dumps(summary_sections, ensure_ascii=False),
                "word_count": len(analysis.get("detailed_summary", "").split()),
                "ai_provider": provider.provider_name,
            },
        )
        record_activity(
            video.user, ActivityLog.Action.SUMMARY_GENERATED,
            description=video.title, target_id=video.id, target_type="video",
        )

        # -------- 5) Key moments + thumbnails -------- #
        _set_progress(video, 90, "Extracting Key Moments")
        video.key_moments.all().delete()
        thumb_dir = os.path.join(settings.MEDIA_ROOT, "thumbnails")
        os.makedirs(thumb_dir, exist_ok=True)
        duration = video.duration_seconds
        for i, km in enumerate(analysis.get("key_moments", []) or []):
            try:
                ts = float(km.get("timestamp_seconds", 0.0) or 0.0)
            except (TypeError, ValueError):
                ts = 0.0
            # The model occasionally returns a timestamp past the end of the
            # video. Clamp it, otherwise the UI shows a time that does not
            # exist and clicking the moment seeks beyond the final frame.
            if duration and ts > duration:
                logger.warning(
                    "Key moment %d timestamp %.1fs exceeds duration %.1fs — clamping.",
                    i, ts, duration,
                )
                ts = max(0.0, duration - 1.0)
            ts = max(0.0, ts)

            moment = KeyMoment.objects.create(
                video=video,
                title=km.get("title", f"Moment {i + 1}"),
                description=km.get("description", ""),
                timestamp_seconds=ts,
                order=km.get("order", i),
            )
            thumb_tmp = os.path.join(thumb_dir, f"_{video_id}_{i}.jpg")
            if generate_thumbnail(local_video_path, ts, thumb_tmp, duration):
                with open(thumb_tmp, "rb") as fh:
                    moment.thumbnail.save(f"{video_id}_{i}.jpg", File(fh), save=True)
                os.remove(thumb_tmp)

        # -------- Complete -------- #
        video.status = Video.Status.COMPLETED
        video.progress = 100
        video.current_step = "Completed"
        video.save(update_fields=["status", "progress", "current_step", "updated_at"])
        logger.info("Video processing completed successfully for video_id: %s", video_id)

    except Exception as exc:
        logger.error("Processing failed for video_id: %s | error=%s", video_id, exc)
        logger.debug("Traceback:\n%s", traceback.format_exc())
        video.status = Video.Status.FAILED
        video.progress = 100
        video.current_step = "Failed"
        video.error_message = str(exc)[:2000]
        video.save(update_fields=["status", "progress", "current_step", "error_message", "updated_at"])

    finally:
        for path in (downloaded_path, compressed_path, audio_file_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError as cleanup_err:
                    logger.warning("Failed to delete temp file %s: %s", path, cleanup_err)
