# backend/transcript.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from faster_whisper import WhisperModel

from database import SessionLocal
from models import Video

import os
import json
import time
import subprocess
from typing import Optional

router = APIRouter()

# 🚀 'tiny' model CPU-ல் குறைந்த RAM & அதிக வேகத்தில் இயங்கும் அமைப்பு
model = None
try:
    model = WhisperModel(
        "tiny",
        device="cpu",
        compute_type="int8",
        cpu_threads=4,
        num_workers=2
    )
except Exception as e:
    print("Whisper Model Load Warning:", e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def extract_optimized_audio(video_path: str, clean_filename: str) -> str:
    try:
        os.makedirs(os.path.join("uploads", "temp_audio"), exist_ok=True)
        audio_path = os.path.join("uploads", "temp_audio", f"{clean_filename}.wav")
        
        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
            return audio_path

        command = [
            "ffmpeg", "-y", "-i", video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            audio_path
        ]
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=20)
        
        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
            return audio_path
    except Exception as e:
        print("Audio extraction fallback:", e)
    return video_path

# =========================================================
# 🟢 1. Transcript Streaming / Instant Cache Fetch
# =========================================================

@router.get("/transcript/stream")
def stream_transcript(
    filename: str,
    language: str = "en",
    db: Session = Depends(get_db)
):
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    clean_filename = os.path.basename(filename)
    video_path = os.path.join("uploads", "videos", clean_filename)

    if not os.path.exists(video_path):
        video_path = os.path.join("uploads", "videos", filename)

    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    video = db.query(Video).filter(
        (Video.video_name == filename) | (Video.video_name == clean_filename)
    ).first()

    # ⚡ Cache Path Check
    cache_path = os.path.join("uploads", "transcripts", f"{clean_filename}.json")

    def generate():
        start_time = time.time()

        # 🚀 1. Background Task ஏற்கெனவே முடித்திருந்தால் Instant SSE Stream (0.1s Load)
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)

                segments = cached_data.get("segments", [])
                cumulative_text = ""

                for idx, seg in enumerate(segments, 1):
                    cumulative_text += seg.get("text", "") + " "
                    data = {
                        "text": cumulative_text.strip(),
                        "language": cached_data.get("language", language),
                        "detected_language": cached_data.get("detected_language", "en"),
                        "word_count": len(cumulative_text.strip().split()),
                        "segment_count": idx,
                        "segment": seg
                    }
                    yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

                summary = {
                    "status": "completed",
                    "processing_time": cached_data.get("processing_time", 0.5),
                    "total_segments": len(segments),
                    "total_words": cached_data.get("word_count", len(cumulative_text.strip().split())),
                    "language": language
                }
                yield f"event: summary\ndata: {json.dumps(summary)}\n\n"
                yield f"event: end\ndata: completed\n\n"
                return
            except Exception as cache_read_err:
                print("Cache Stream Fallback to Live Whisper:", cache_read_err)

        # 🚀 2. Cache இல்லாத பட்சத்தில் Live Whisper Processing
        transcript_text = ""
        total_segments = 0
        all_segments = []

        try:
            if not model:
                raise Exception("Whisper model not ready")

            target_input = extract_optimized_audio(video_path, clean_filename)

            segments, info = model.transcribe(
                target_input,
                beam_size=1,
                best_of=1,
                temperature=0.0,
                condition_on_previous_text=False,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300)
            )

            detected_lang = getattr(info, "language", "en")

            for segment in segments:
                total_segments += 1
                segment_text = segment.text.strip()
                transcript_text += segment_text + " "

                segment_data = {
                    "start": round(float(segment.start), 2),
                    "end": round(float(segment.end), 2),
                    "text": segment_text
                }
                all_segments.append(segment_data)

                data = {
                    "text": transcript_text.strip(),
                    "language": language,
                    "detected_language": detected_lang,
                    "word_count": len(transcript_text.strip().split()),
                    "segment_count": total_segments,
                    "segment": segment_data
                }

                yield f"data: {json.dumps(data, ensure_ascii=False)}\n\n"

            processing_time = round(time.time() - start_time, 2)

            # Database Update
            try:
                if video:
                    video.language = language
                    video.processing_time = processing_time
                    video.word_count = len(transcript_text.strip().split())
                    video.transcript_length = len(transcript_text.strip())
                    if hasattr(video, "transcript"):
                        video.transcript = transcript_text.strip()
                    db.commit()
            except Exception:
                db.rollback()

            # Cache Save
            try:
                os.makedirs(os.path.join("uploads", "transcripts"), exist_ok=True)
                cache_content = {
                    "transcript": transcript_text.strip(),
                    "language": language,
                    "detected_language": detected_lang,
                    "segments": all_segments,
                    "processing_time": processing_time,
                    "word_count": len(transcript_text.strip().split()),
                    "total_segments": total_segments
                }
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(cache_content, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

            summary = {
                "status": "completed",
                "processing_time": processing_time,
                "total_segments": total_segments,
                "total_words": len(transcript_text.strip().split()),
                "language": language
            }

            yield f"event: summary\ndata: {json.dumps(summary)}\n\n"
            yield f"event: end\ndata: completed\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'status': 'failed', 'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# =========================================================
# 🟢 2. Instant Pre-Saved Transcript Fetch for Learners
# =========================================================

@router.get("/transcript/get")
def get_saved_transcript(filename: str, db: Session = Depends(get_db)):
    if not filename:
        raise HTTPException(status_code=400, detail="Filename parameter is required")

    clean_filename = os.path.basename(filename)
    cache_path = os.path.join("uploads", "transcripts", f"{clean_filename}.json")
    
    # 1. Direct Cache Lookup (Instant 0.1s)
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            cached_data["success"] = True
            return cached_data
        except Exception:
            pass

    # 2. Database Fallback
    video = db.query(Video).filter(
        (Video.video_name == filename) | (Video.video_name == clean_filename)
    ).first()

    if video and hasattr(video, "transcript") and video.transcript:
        return {
            "success": True,
            "transcript": video.transcript,
            "language": getattr(video, "language", "en"),
            "processing_time": getattr(video, "processing_time", 0.5),
            "word_count": getattr(video, "word_count", 0),
            "segments": []
        }

    return {"success": False, "detail": "Pre-saved transcript not found."}

# =========================================================
# 🟢 3. Review & Edit Transcript for Educator
# =========================================================

class TranscriptEditRequest(BaseModel):
    filename: str
    transcript: Optional[str] = None
    updated_transcript: Optional[str] = None

@router.put("/transcript/edit")
@router.put("/transcript/update")
def edit_transcript(payload: TranscriptEditRequest, db: Session = Depends(get_db)):
    if not payload.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    new_text = payload.transcript or payload.updated_transcript
    if new_text is None:
        raise HTTPException(status_code=400, detail="Updated transcript content is required")

    clean_filename = os.path.basename(payload.filename)

    # 1. Update Database
    video = db.query(Video).filter(
        (Video.video_name == payload.filename) | (Video.video_name == clean_filename)
    ).first()

    if video:
        if hasattr(video, "transcript"):
            video.transcript = new_text.strip()
        video.transcript_length = len(new_text.strip())
        video.word_count = len(new_text.strip().split())
        db.commit()

    # 2. Update Cache File
    cache_path = os.path.join("uploads", "transcripts", f"{clean_filename}.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            cached_data["transcript"] = new_text.strip()
            cached_data["word_count"] = len(new_text.strip().split())
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cached_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    return {
        "success": True,
        "message": "Transcript updated successfully",
        "updated_transcript": new_text.strip()
    }