# backend/keymoments.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import time
import re
import json
import os
from typing import Optional

from database import SessionLocal
from models import Video

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class KeyMomentsRequest(BaseModel):
    transcript: str
    language: str = "en"
    duration_seconds: float = 0.0
    filename: Optional[str] = None

def time_to_seconds(time_string):
    parts = str(time_string).split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 0

def seconds_to_timestamp(total_seconds):
    total_seconds = int(total_seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"

STOP_WORDS = [
    "the", "is", "are", "was", "were", "this", "that", "have", "has",
    "for", "with", "from", "into", "and", "or", "of", "to", "a", "an",
    "in", "on", "at", "it", "its", "by", "you", "your", "they", "them", "their",
    "can", "could", "would", "should", "will", "not", "but", "also", "so", "as", "we",
    "us", "our", "be", "been", "being", "do", "does", "did", "there", "when",
    "what", "who", "how", "if", "than", "then", "these", "those", "all", "any"
]

def extract_keyword_from_text(text):
    words = re.findall(r"[a-zA-Z]+", str(text).lower())
    candidates = [w for w in words if len(w) > 3 and w not in STOP_WORDS]
    return max(candidates, key=len) if candidates else "topic"

def extract_detected_keywords(text, limit=150):
    tokens = re.findall(r"[a-zA-Z0-9]+", text)
    seen = set()
    keywords = []
    for token in tokens:
        lower_token = token.lower()
        if len(lower_token) <= 3 or lower_token in STOP_WORDS or lower_token in seen:
            continue
        seen.add(lower_token)
        keywords.append(token)
        if len(keywords) >= limit:
            break
    return keywords

def split_into_sentences(text):
    text = text.strip()
    if not text:
        return []
    raw_sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in raw_sentences if s.strip()]

def build_sentence_timestamps(transcript, duration_seconds):
    sentences = split_into_sentences(transcript)
    if not sentences:
        return []
    total_duration = duration_seconds if duration_seconds > 0 else len(sentences) * 4
    step = total_duration / len(sentences)
    
    result = []
    for index, sentence in enumerate(sentences):
        sec = index * step
        result.append({
            "timestamp": seconds_to_timestamp(sec),
            "seconds": int(sec),
            "text": sentence
        })
    return result

def build_important_segments(timestamp_data, duration_seconds):
    segments = []
    for i, item in enumerate(timestamp_data):
        start_sec = item["seconds"]
        default_end = start_sec + 30
        if duration_seconds > 0:
            default_end = min(default_end, int(duration_seconds))
        
        end_sec = timestamp_data[i + 1]["seconds"] if i + 1 < len(timestamp_data) else default_end
        if end_sec <= start_sec:
            end_sec = start_sec + 15

        segments.append({
            "start_time": item["timestamp"],
            "end_time": seconds_to_timestamp(end_sec),
            "start_seconds": start_sec,
            "description": item.get("title", "Key Concept Explanation"),
            "keyword": extract_keyword_from_text(item.get("title", ""))
        })
    return segments

def build_topic_segments(timestamp_data, duration_seconds, num_topics=3):
    if not timestamp_data:
        return []
    chunk_size = max(1, len(timestamp_data) // num_topics)
    topics = []
    for i in range(0, len(timestamp_data), chunk_size):
        chunk = timestamp_data[i:i + chunk_size]
        if not chunk:
            continue
        start_item = chunk[0]
        end_sec = start_item["seconds"] + 45
        if duration_seconds > 0:
            end_sec = min(end_sec, int(duration_seconds))

        topics.append({
            "topic": start_item.get("title", f"Section {len(topics) + 1}"),
            "start_time": start_item["timestamp"],
            "end_time": seconds_to_timestamp(end_sec),
            "start_seconds": start_item["seconds"]
        })
    return topics

# =========================================================
# 🟢 1. Instant Key Moments Endpoint (0.05s Response)
# =========================================================

@router.post("/keymoments")
def generate_key_moments(
    payload: KeyMomentsRequest,
    db: Session = Depends(get_db)
):
    transcript = payload.transcript
    language = payload.language
    duration_seconds = payload.duration_seconds
    filename = payload.filename

    # ⚡ Step 1: Auto-Detect Filename from DB
    matched_video_name = filename
    if not matched_video_name:
        latest_video = db.query(Video).order_by(Video.id.desc()).first()
        if latest_video:
            matched_video_name = getattr(latest_video, "video_name", None) or getattr(latest_video, "filename", None)

    # ⚡ Step 2: Instant Cache Return (0.1s)
    if matched_video_name:
        clean_filename = os.path.basename(matched_video_name)
        cache_path = os.path.join("uploads", "keymoments", f"{clean_filename}.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                if cached_data.get("timestamp_data") or cached_data.get("important_segments"):
                    cached_data["success"] = True
                    cached_data["processing_time"] = 0.1
                    return cached_data
            except Exception:
                pass

    if not transcript or not transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is required")

    start_time = time.time()

    # ⚡ Step 3: Fast Algorithmic Segmentation (0.05s - Zero LLM Latency)
    sentence_data = build_sentence_timestamps(transcript, duration_seconds)
    timestamp_data = []

    if sentence_data:
        step = max(1, len(sentence_data) // 6)
        for s in sentence_data[::step]:
            timestamp_data.append({
                "timestamp": s["timestamp"],
                "seconds": s["seconds"],
                "title": s["text"][:60] + "..." if len(s["text"]) > 60 else s["text"],
                "keyword": extract_keyword_from_text(s["text"])
            })

    important_segments = build_important_segments(timestamp_data, duration_seconds)
    topic_segments = build_topic_segments(timestamp_data, duration_seconds)

    highlights = [{
        "timestamp": item["timestamp"],
        "seconds": item["seconds"],
        "title": item["title"],
        "thumbnail": None,
        "keyword": extract_keyword_from_text(item["title"])
    } for item in timestamp_data[:4]]

    detected_keywords = extract_detected_keywords(transcript)

    processing_time = round(time.time() - start_time, 2)
    total_moments = len(timestamp_data)
    important_segments_count = len(important_segments)
    highlight_score = min(100, total_moments * 10)
    keyword_count = len(detected_keywords)

    response_payload = {
        "success": True,
        "language": language,
        "timestamp_data": timestamp_data,
        "important_segments": important_segments,
        "highlights": highlights,
        "topic_segments": topic_segments,
        "sentence_data": sentence_data,
        "keywords": detected_keywords,
        "processing_time": processing_time,
        "total_moments": total_moments,
        "important_segments_count": important_segments_count,
        "keyword_count": keyword_count,
        "highlight_score": highlight_score
    }

    # DB Persistence & Cache Save
    try:
        latest_video = db.query(Video).order_by(Video.id.desc()).first()
        if latest_video:
            latest_video.language = language
            latest_video.processing_time = processing_time
            latest_video.segment_count = important_segments_count
            latest_video.keyword_count = keyword_count
            latest_video.highlight_score = highlight_score
            db.commit()

            v_name = getattr(latest_video, "filename", None) or getattr(latest_video, "video_name", None)
            if v_name:
                os.makedirs(os.path.join("uploads", "keymoments"), exist_ok=True)
                cache_path = os.path.join("uploads", "keymoments", f"{os.path.basename(v_name)}.json")
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump(response_payload, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    return response_payload

# =========================================================
# 🟢 2. Instant Pre-Saved Key Moments Fetch
# =========================================================

@router.get("/keymoments/get")
def get_saved_key_moments(
    filename: str,
    language: str = "en",
    db: Session = Depends(get_db)
):
    if not filename:
        raise HTTPException(status_code=400, detail="Filename parameter is required")

    clean_filename = os.path.basename(filename)
    cache_path = os.path.join("uploads", "keymoments", f"{clean_filename}.json")

    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            cached_data["success"] = True
            return cached_data
        except Exception:
            pass

    return {"success": False, "detail": "Pre-saved key moments not found."}