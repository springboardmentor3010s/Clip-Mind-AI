# backend/summary.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import ollama
import time
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from database import SessionLocal
from models import Video

router = APIRouter()

CPU_THREADS = min(8, os.cpu_count() or 4)

# 🟢 Docker & Local Host Compatibility
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
ollama_client = ollama.Client(host=OLLAMA_HOST)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SummaryRequest(BaseModel):
    transcript: str
    language: str = "en"
    filename: Optional[str] = None

# 🟢 வீடியோவின் நீளத்திற்கு ஏற்ப Context & Rules அமைக்கும் Helper
def get_dynamic_summary_config(text: str):
    words = len(text.strip().split())
    
    if words < 300:
        short_rule = "Write a concise 2-sentence summary."
        detailed_rule = "Write strictly 3-4 key bullet points (•), each explaining a core idea."
        max_pred_short, max_pred_det = 100, 180
    elif words < 1200:
        short_rule = "Write a comprehensive 3-4 sentences summary covering the key message."
        detailed_rule = "Write strictly 5-7 informative bullet points (•) covering all main topics."
        max_pred_short, max_pred_det = 140, 260
    else:
        short_rule = "Write an executive summary of 4-5 sentences capturing the main objectives and conclusions."
        detailed_rule = "Write strictly 8-10 detailed bullet points (•) detailing each major section, insights, and takeaways."
        max_pred_short, max_pred_det = 180, 360

    return short_rule, detailed_rule, max_pred_short, max_pred_det

def prepare_fast_transcript(text: str, max_chars: int = 3500) -> str:
    if len(text) <= max_chars:
        return text
    part = max_chars // 3
    return (
        text[:part]
        + "\n...\n"
        + text[len(text) // 2 - part // 2 : len(text) // 2 + part // 2]
        + "\n...\n"
        + text[-part:]
    )

def fetch_short_summary(prompt: str, token_limit: int) -> str:
    res = ollama_client.chat(
        model="llama3.2:1b",
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": 0.2,
            "num_ctx": 1024,
            "num_predict": token_limit,
            "num_thread": CPU_THREADS
        }
    )
    return res["message"]["content"].strip()

def fetch_detailed_summary(prompt: str, token_limit: int) -> str:
    res = ollama_client.chat(
        model="llama3.2:1b",
        messages=[{"role": "user", "content": prompt}],
        options={
            "temperature": 0.2,
            "num_ctx": 1024,
            "num_predict": token_limit,
            "num_thread": CPU_THREADS
        }
    )
    return res["message"]["content"].strip()

# =========================================================
# 🟢 Dynamic Length Summary Generation (Instant Cache + Fallback)
# =========================================================

@router.post("/summary")
def generate_summary(
    payload: SummaryRequest,
    db: Session = Depends(get_db)
):
    transcript = payload.transcript
    language = payload.language
    filename = payload.filename

    # ⚡ 1. Cache Lookup First (0.1s Load)
    matched_video_name = filename
    if not matched_video_name:
        latest_video = db.query(Video).order_by(Video.id.desc()).first()
        if latest_video:
            matched_video_name = getattr(latest_video, "video_name", None) or getattr(latest_video, "filename", None)

    if matched_video_name:
        clean_filename = os.path.basename(matched_video_name)
        cache_path = os.path.join("uploads", "summaries", f"{clean_filename}.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                if cached_data.get("short_summary") and cached_data.get("detailed_summary"):
                    cached_data["success"] = True
                    cached_data["processing_time"] = 0.2
                    return cached_data
            except Exception:
                pass

    if not transcript or not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")

    start_time = time.time()

    lang_names = {
        "ta": "Tamil (தமிழ்)", "hi": "Hindi (हिंदी)", "te": "Telugu (తెలుగు)",
        "ml": "Malayalam (മലയാളം)", "kn": "Kannada (கன்னட)", "mr": "Marathi",
        "gu": "Gujarati", "bn": "Bengali", "pa": "Punjabi", "ur": "Urdu",
        "en": "English"
    }
    target_lang_name = lang_names.get(language, language)

    short_rule, detailed_rule, pred_short, pred_det = get_dynamic_summary_config(transcript)
    fast_transcript = prepare_fast_transcript(transcript)

    short_prompt = f"""
You are an AI Video Summarizer.

TASK:
{short_rule}

STRICT RULES:
1. Do NOT use bullet points or headings.
2. Write ONLY in {target_lang_name} ({language}).

Transcript:
{fast_transcript}
"""

    detailed_prompt = f"""
You are an AI Video Summarizer.

TASK:
{detailed_rule}

STRICT RULES:
1. Each bullet point should be 1-2 sentences.
2. Do NOT write extra intro phrases or headings.
3. Write ONLY in {target_lang_name} ({language}).

Transcript:
{fast_transcript}
"""

    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            future_short = executor.submit(fetch_short_summary, short_prompt, pred_short)
            future_detailed = executor.submit(fetch_detailed_summary, detailed_prompt, pred_det)

            short_sum = future_short.result()
            detailed_sum = future_detailed.result()

        short_sum = short_sum.replace("Short Summary:", "").replace("Short Summary", "").strip()
        detailed_sum = detailed_sum.replace("Detailed Summary:", "").replace("Detailed Summary", "").strip()

        processing_time = round(time.time() - start_time, 2)

        # Database Update & Cache Save
        try:
            latest_video = db.query(Video).order_by(Video.id.desc()).first()
            if latest_video:
                latest_video.processing_time = processing_time
                latest_video.summary_length = len(detailed_sum)
                latest_video.language = language
                if hasattr(latest_video, "short_summary"):
                    latest_video.short_summary = short_sum
                if hasattr(latest_video, "detailed_summary"):
                    latest_video.detailed_summary = detailed_sum
                db.commit()

                v_name = getattr(latest_video, "video_name", None) or getattr(latest_video, "filename", None)
                if v_name:
                    os.makedirs(os.path.join("uploads", "summaries"), exist_ok=True)
                    cache_path = os.path.join("uploads", "summaries", f"{os.path.basename(v_name)}.json")
                    with open(cache_path, "w", encoding="utf-8") as f:
                        json.dump({
                            "short_summary": short_sum,
                            "detailed_summary": detailed_sum,
                            "language": language,
                            "processing_time": processing_time,
                            "is_shared": getattr(latest_video, "is_shared", False)
                        }, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return {
            "success": True,
            "language": language,
            "short_summary": short_sum,
            "detailed_summary": detailed_sum,
            "processing_time": processing_time
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

# =========================================================
# 🟢 Pre-Saved Summary Fetch & Share
# =========================================================

@router.get("/summary/get")
def get_saved_summary(filename: str, language: str = "en", db: Session = Depends(get_db)):
    if not filename:
        raise HTTPException(status_code=400, detail="Filename parameter is required")

    clean_filename = os.path.basename(filename)
    cache_path = os.path.join("uploads", "summaries", f"{clean_filename}.json")

    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            cached_data["success"] = True
            cached_data["filename"] = filename
            return cached_data
        except Exception:
            pass

    return {"success": False, "detail": "Pre-saved summary not found."}

class ShareSummarySchema(BaseModel):
    filename: str
    is_shared: bool = True

@router.post("/summary/share")
def share_summary(payload: ShareSummarySchema, db: Session = Depends(get_db)):
    clean_filename = os.path.basename(payload.filename)
    video = db.query(Video).filter((Video.video_name == payload.filename) | (Video.video_name == clean_filename)).first()
    if video and hasattr(video, "is_shared"):
        video.is_shared = payload.is_shared
        db.commit()

    cache_path = os.path.join("uploads", "summaries", f"{clean_filename}.json")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            cached_data["is_shared"] = payload.is_shared
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(cached_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    return {"success": True, "message": "Sharing status updated", "is_shared": payload.is_shared}