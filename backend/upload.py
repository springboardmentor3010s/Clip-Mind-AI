# backend/upload.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, BackgroundTasks
from sqlalchemy.orm import Session
import shutil
import os
import uuid
import json
import time
import subprocess
import yt_dlp
import ollama
from concurrent.futures import ThreadPoolExecutor

import models
from database import SessionLocal

router = APIRouter()

# ==========================
# Folders Setup
# ==========================

VIDEO_FOLDER = "uploads/videos"
AUDIO_FOLDER = "uploads/audio"
TRANSCRIPT_FOLDER = "uploads/transcripts"
SUMMARY_FOLDER = "uploads/summaries"
KEYMOMENTS_FOLDER = "uploads/keymoments"

os.makedirs(VIDEO_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)
os.makedirs(TRANSCRIPT_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)
os.makedirs(KEYMOMENTS_FOLDER, exist_ok=True)

# 🟢 Docker & Local Host Compatibility
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
ollama_client = ollama.Client(host=OLLAMA_HOST)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =========================================================
# ⚡ Background Task: Transcript + Key Moments + Dynamic Summary
# =========================================================

def background_process_video(video_path: str, filename: str, language: str = "en"):
    """Video Upload ஆனதும் Background-ல் Transcript, Key Moments & Summary தயாரிக்கும் Worker"""
    clean_name = os.path.basename(filename)
    db = SessionLocal()
    try:
        # 1. 16kHz Mono Audio Extraction
        audio_temp_path = os.path.join(AUDIO_FOLDER, f"{os.path.splitext(clean_name)[0]}.wav")
        if not os.path.exists(audio_temp_path) or os.path.getsize(audio_temp_path) == 0:
            cmd = [
                "ffmpeg", "-y", "-i", video_path,
                "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                audio_temp_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=40)

        # 2. Faster-Whisper Model Processing
        from faster_whisper import WhisperModel
        whisper_model = WhisperModel("tiny", device="cpu", compute_type="int8", cpu_threads=4)
        
        target_audio = audio_temp_path if (os.path.exists(audio_temp_path) and os.path.getsize(audio_temp_path) > 0) else video_path
        segments, info = whisper_model.transcribe(
            target_audio,
            beam_size=1,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300)
        )

        all_segments = []
        full_transcript = []
        key_moments = []

        for segment in segments:
            seg_text = segment.text.strip()
            full_transcript.append(seg_text)
            seg_data = {
                "start": round(float(segment.start), 2),
                "end": round(float(segment.end), 2),
                "text": seg_text
            }
            all_segments.append(seg_data)

            if len(all_segments) % 3 == 0 or len(all_segments) == 1:
                mins = int(segment.start // 60)
                secs = int(segment.start % 60)
                key_moments.append({
                    "timestamp": f"{mins:02d}:{secs:02d}",
                    "point": seg_text
                })

        transcript_text = " ".join(full_transcript).strip()

        # 3. Save Transcript Cache File
        transcript_cache_file = os.path.join(TRANSCRIPT_FOLDER, f"{clean_name}.json")
        with open(transcript_cache_file, "w", encoding="utf-8") as f:
            json.dump({
                "transcript": transcript_text,
                "language": language,
                "detected_language": getattr(info, "language", "en"),
                "segments": all_segments,
                "word_count": len(transcript_text.split()),
                "total_segments": len(all_segments)
            }, f, ensure_ascii=False, indent=2)

        # 4. Save Key Moments Cache File
        keymoments_cache_file = os.path.join(KEYMOMENTS_FOLDER, f"{clean_name}.json")
        with open(keymoments_cache_file, "w", encoding="utf-8") as f:
            json.dump({
                "filename": clean_name,
                "key_moments": key_moments
            }, f, ensure_ascii=False, indent=2)

        # 5. Background Dynamic Summary Generation
        short_sum = ""
        detailed_sum = ""
        if transcript_text:
            trimmed_ctx = transcript_text[:2500]
            words = len(transcript_text.split())

            if words < 300:
                short_rule = "Write a concise 2-sentence summary."
                detailed_rule = "Write strictly 3-4 key bullet points (•)."
                pred_s, pred_d = 100, 180
            elif words < 1200:
                short_rule = "Write a comprehensive 3-4 sentences summary."
                detailed_rule = "Write strictly 5-7 informative bullet points (•)."
                pred_s, pred_d = 140, 260
            else:
                short_rule = "Write an executive summary of 4-5 sentences."
                detailed_rule = "Write strictly 8-10 detailed bullet points (•)."
                pred_s, pred_d = 180, 360

            short_prompt = f"""You are an AI Video Summarizer.\nTASK: {short_rule}\nSTRICT RULES: Do NOT use bullet points or headings.\nTranscript:\n{trimmed_ctx}"""
            detailed_prompt = f"""You are an AI Video Summarizer.\nTASK: {detailed_rule}\nSTRICT RULES: Each bullet point should be 1-2 sentences.\nTranscript:\n{trimmed_ctx}"""

            def fetch_short():
                res = ollama_client.chat(
                    model="llama3.2:1b",
                    messages=[{"role": "user", "content": short_prompt}],
                    options={"temperature": 0.2, "num_ctx": 1024, "num_predict": pred_s, "num_thread": 4}
                )
                return res["message"]["content"].replace("Short Summary:", "").replace("Short Summary", "").strip()

            def fetch_detailed():
                res = ollama_client.chat(
                    model="llama3.2:1b",
                    messages=[{"role": "user", "content": detailed_prompt}],
                    options={"temperature": 0.2, "num_ctx": 1024, "num_predict": pred_d, "num_thread": 4}
                )
                return res["message"]["content"].replace("Detailed Summary:", "").replace("Detailed Summary", "").strip()

            with ThreadPoolExecutor(max_workers=2) as executor:
                f_s = executor.submit(fetch_short)
                f_d = executor.submit(fetch_detailed)
                short_sum = f_s.result()
                detailed_sum = f_d.result()

            # Save Summary Cache File
            summary_cache_file = os.path.join(SUMMARY_FOLDER, f"{clean_name}.json")
            with open(summary_cache_file, "w", encoding="utf-8") as f:
                json.dump({
                    "short_summary": short_sum,
                    "detailed_summary": detailed_sum,
                    "language": language,
                    "processing_time": 0.5,
                    "is_shared": False
                }, f, ensure_ascii=False, indent=2)

        # 6. Update Database Record
        video_rec = db.query(models.Video).filter(
            (models.Video.video_name == filename) | (models.Video.video_name == clean_name)
        ).first()
        if video_rec:
            video_rec.transcript = transcript_text
            video_rec.transcript_length = len(transcript_text)
            video_rec.word_count = len(transcript_text.split())
            if hasattr(video_rec, "short_summary") and short_sum:
                video_rec.short_summary = short_sum
            if hasattr(video_rec, "detailed_summary") and detailed_sum:
                video_rec.detailed_summary = detailed_sum
            db.commit()

        print(f"✅ Background Pipeline Completed for {clean_name}")

    except Exception as bg_err:
        print("Background Processing Error:", bg_err)
    finally:
        db.close()

# ==========================
# 1. Upload Video (Local File)
# ==========================

@router.post("/upload")
def upload_video(
    background_tasks: BackgroundTasks,
    user_id: int = 1,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.filename == "":
        raise HTTPException(status_code=400, detail="No file selected")

    allowed_extensions = [".mp4", ".avi", ".mov", ".mkv"]
    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only video files are allowed")

    video_path = os.path.join(VIDEO_FOLDER, file.filename)

    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save video file: {str(e)}")

    file_size = os.path.getsize(video_path)
    duration = 0.0
    language = "English"

    audio_filename = os.path.splitext(file.filename)[0] + ".wav"
    audio_path = os.path.join(AUDIO_FOLDER, audio_filename)

    try:
        from moviepy.editor import VideoFileClip
        video = VideoFileClip(video_path)
        duration = round(video.duration, 2) if video.duration else 0.0
        if video.audio is not None:
            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
        video.close()
    except Exception as e:
        print("MoviePy Audio Extraction Warning:", e)
        if not os.path.exists(audio_path):
            with open(audio_path, "wb") as f:
                f.write(b"")

    valid_user_id = user_id
    try:
        if hasattr(models, "User"):
            existing_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not existing_user:
                first_user = db.query(models.User).first()
                valid_user_id = first_user.id if first_user else None
    except Exception as user_err:
        print("User Query Warning:", user_err)

    video_id = 1
    try:
        new_video = models.Video(
            user_id=valid_user_id,
            video_name=file.filename,
            file_path=video_path,
            language=language,
            duration=duration,
            file_size=file_size,
            transcript_length=0,
            word_count=0,
            processing_time=0,
            summary_length=0,
            keyword_count=0,
            segment_count=0,
            highlight_score=0
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        video_id = new_video.id
    except Exception as db_err:
        db.rollback()
        print("DB Save Warning:", db_err)

    # 🚀 Background AI Pipeline Execution
    background_tasks.add_task(background_process_video, video_path, file.filename, language)

    return {
        "success": True,
        "message": "Video uploaded successfully. AI processing in background.",
        "video_id": video_id,
        "filename": file.filename,
        "video_url": f"http://127.0.0.1:8000/uploads/videos/{file.filename}",
        "video_path": f"uploads/videos/{file.filename}",
        "audio_path": f"uploads/audio/{audio_filename}",
        "duration": duration,
        "file_size": round(file_size / (1024 * 1024), 2),
        "language": language,
        "next_step": "Audio Extracted Successfully"
    }

# ==========================
# 2. Upload Video via URL
# ==========================

@router.post("/upload-url")
def upload_video_url(
    background_tasks: BackgroundTasks,
    user_id: int = Form(1),
    url: str = Form(...),
    db: Session = Depends(get_db)
):
    unique_id = str(uuid.uuid4())[:8]
    video_filename = f"{unique_id}.mp4"
    video_path = os.path.join(VIDEO_FOLDER, video_filename)

    audio_filename = f"{unique_id}.wav"
    audio_path = os.path.join(AUDIO_FOLDER, audio_filename)

    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': video_path,
        'merge_output_format': 'mp4',
        'quiet': True,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download video from URL: {str(e)}")

    if not os.path.exists(video_path) or os.path.getsize(video_path) == 0:
        raise HTTPException(status_code=500, detail="Video download failed: file not found after download")

    file_size = os.path.getsize(video_path)
    duration = 0.0
    language = "English"

    try:
        from moviepy.editor import VideoFileClip
        video = VideoFileClip(video_path)
        duration = round(video.duration, 2) if video.duration else 0.0
        if video.audio is not None:
            video.audio.write_audiofile(audio_path, verbose=False, logger=None)
        video.close()
    except Exception as e:
        print("URL Video Audio Extraction Warning:", e)
        if not os.path.exists(audio_path):
            with open(audio_path, "wb") as f:
                f.write(b"")

    valid_user_id = user_id
    try:
        if hasattr(models, "User"):
            existing_user = db.query(models.User).filter(models.User.id == user_id).first()
            if not existing_user:
                first_user = db.query(models.User).first()
                valid_user_id = first_user.id if first_user else None
    except Exception as user_err:
        print("User Query Warning:", user_err)

    video_id = 1
    try:
        new_video = models.Video(
            user_id=valid_user_id,
            video_name=video_filename,
            file_path=video_path,
            language=language,
            duration=duration,
            file_size=file_size,
            transcript_length=0,
            word_count=0,
            processing_time=0,
            summary_length=0,
            keyword_count=0,
            segment_count=0,
            highlight_score=0
        )
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        video_id = new_video.id
    except Exception as db_err:
        db.rollback()
        print("DB Save Warning:", db_err)

    # 🚀 Background AI Pipeline Execution
    background_tasks.add_task(background_process_video, video_path, video_filename, language)

    return {
        "success": True,
        "message": "URL Video downloaded & AI processing in background",
        "video_id": video_id,
        "filename": video_filename,
        "video_url": f"http://127.0.0.1:8000/{video_path}",
        "video_path": video_path,
        "audio_path": f"uploads/audio/{audio_filename}",
        "duration": duration,
        "file_size": round(file_size / (1024 * 1024), 2),
        "language": language,
        "next_step": "Audio Extracted Successfully"
    }

# ==========================
# 3. Get All Uploaded Videos
# ==========================

@router.get("/videos/all")
def get_all_videos(db: Session = Depends(get_db)):
    videos = db.query(models.Video).order_by(models.Video.id.desc()).all()
    return videos