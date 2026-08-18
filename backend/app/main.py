import os
import json
import time
import datetime
import shutil
import asyncio
import uuid
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from backend.app.database import Base, engine, get_db, SessionLocal
from backend.app.models import (
    UserModel,
    VideoModel,
    TranscriptModel,
    SummaryModel,
    KeyMomentModel,
    ActivityLogModel,
    BookmarkModel,
    ClassroomModel,
    ClassroomMemberModel,
    ClassroomVideoModel,
    AssignmentModel,
)
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from backend.app.video_processor import probe_video, extract_audio, generate_thumbnail, UPLOAD_DIR
from backend.app.ai_whisper import process_audio_whisper
from backend.app.ai_summarizer import summarize_transcript_bart
from backend.app.ai_key_moments import detect_key_moments
from backend.app.analytics_engine import (
    compute_platform_analytics,
    compute_user_analytics,
)

# Create DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ClipMind AI API",
    description="Video Summarization & Key Moments Detection Platform API",
    version="1.0.0"
)

@app.on_event("startup")
def startup_db_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_users = [
            ('admin@clipmind.ai', 'admin123', 'Platform Admin', 'ADMINISTRATOR'),
            ('creator@clipmind.ai', 'creator123', 'Alex Creator', 'CONTENT_CREATOR'),
            ('educator@clipmind.ai', 'educator123', 'Prof. Sarah Jenkins', 'EDUCATOR'),
            ('learner@clipmind.ai', 'learner123', 'David Learner', 'LEARNER'),
            ('testuser@gmail.com', 'test12345', 'Test User', 'LEARNER'),
            ('rushika1@gmail.com', 'rushika123', 'Rushika User', 'LEARNER'),
            ('rushikareddygoturi@gmail.com', 'rushika123', 'Rushika Reddy', 'ADMINISTRATOR'),
        ]
        for email, password, name, role in seed_users:
            clean_email = email.lower().strip()
            existing = db.query(UserModel).filter(func.lower(UserModel.email) == clean_email).first()
            if not existing:
                u = UserModel(
                    email=clean_email,
                    hashed_password=hash_password(password),
                    name=name,
                    role=role
                )
                db.add(u)
            else:
                # Keep seeded accounts synchronized
                changed = False

                if not verify_password(password, existing.hashed_password):
                    existing.hashed_password = hash_password(password)
                    changed = True

                if existing.role != role:
                    existing.role = role
                    changed = True

                if existing.name != name:
                    existing.name = name
                    changed = True

                if changed:
                    db.add(existing)
        db.commit()
        print("[CLIPMIND SEED]: Database seed/sync complete.", flush=True)
    except Exception as e:
        print(f"[CLIPMIND SEED ERROR]: {e}", flush=True)
    finally:
        db.close()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded media directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {
        "name": "ClipMind AI API",
        "status": "running",
        "frontend": "http://localhost:3000",
        "api_docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# Pydantic Schemas
class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = "content_creator"

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class VideoUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None

class RoleUpdateSchema(BaseModel):
    role: str

class BookmarkSchema(BaseModel):
    videoId: str
    type: str # SUMMARY, HIGHLIGHT, TRANSCRIPT
    contentSnippet: str
    timestampSec: Optional[float] = None


class ClassroomCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None


class ClassroomUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ClassroomJoinSchema(BaseModel):
    code: str


class AssignmentCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None

def seed_initial_data(db: Session):
    """Seed initial demo accounts and sample video for instant testing"""
    if db.query(UserModel).count() == 0:
        admin = UserModel(
            email="admin@clipmind.ai",
            hashed_password=hash_password("admin123"),
            name="Platform Admin",
            role="ADMINISTRATOR"
        )
        creator = UserModel(
            email="creator@clipmind.ai",
            hashed_password=hash_password("creator123"),
            name="Alex Creator",
            role="CONTENT_CREATOR"
        )
        educator = UserModel(
            email="educator@clipmind.ai",
            hashed_password=hash_password("educator123"),
            name="Prof. Sarah Jenkins",
            role="EDUCATOR"
        )
        learner = UserModel(
            email="learner@clipmind.ai",
            hashed_password=hash_password("learner123"),
            name="David Learner",
            role="LEARNER"
        )
        db.add_all([admin, creator, educator, learner])
        db.commit()

        # Create demo sample video
        demo_vid = VideoModel(
            title="ClipMind AI - Architectural Deep Dive & Speech Synthesis",
            description="Complete introduction to OpenAI Whisper transcription, BART NLP summarization, and automated Key Moment extraction.",
            file_name="demo_presentation.mp4",
            file_path=os.path.join(UPLOAD_DIR, "demo_presentation.mp4"),
            file_url="/uploads/demo_presentation.mp4",
            duration=125.5,
            size=14200000,
            status="COMPLETED",
            progress=100,
            category="AI & Machine Learning",
            uploader_id=creator.id,
            views_count=42
        )
        db.add(demo_vid)
        db.commit()

        # Demo Transcript
        demo_transcript = TranscriptModel(
            video_id=demo_vid.id,
            language="en",
            full_text="Welcome to the ClipMind AI platform presentation. Today we will explore automated speech-to-text conversion using OpenAI Whisper, abstractive NLP summarization using Hugging Face BART models, and intelligent key moments detection. Notice how each video processing phase updates real-time status monitors.",
            segments_json=json.dumps([
                {"id": "seg-1", "start": 0.0, "end": 25.0, "text": "Welcome to the ClipMind AI platform presentation. Today we will explore automated speech-to-text conversion using OpenAI Whisper.", "speaker": "Alex", "confidence": 0.98},
                {"id": "seg-2", "start": 25.0, "end": 65.0, "text": "Next, we generate concise short summaries, multi-section detailed breakdowns, and high-level content abstractions using BART transformers.", "speaker": "Alex", "confidence": 0.96},
                {"id": "seg-3", "start": 65.0, "end": 125.5, "text": "Finally, topic segmentation identifies key timestamped highlight cards, extracts domain keywords, and feeds live analytics dashboards.", "speaker": "Alex", "confidence": 0.97}
            ])
        )
        db.add(demo_transcript)

        # Demo Summary
        demo_summary = SummaryModel(
            video_id=demo_vid.id,
            short_summary="This presentation demonstrates the full ClipMind AI pipeline: Whisper speech-to-text, BART NLP summarization, and automated key moment extraction.",
            detailed_summary="### 1. Platform Overview\nIntroduces ClipMind AI's architecture for Content Creators, Learners, Educators, and Administrators.\n\n### 2. Core AI Pipeline\n1. **Whisper Transcription**: Converts video audio into timestamped segment arrays.\n2. **BART Summarization**: Generates short, detailed, and abstractive summaries.\n3. **Key Moments Detection**: Highlights pivotal video timestamps with importance scores.",
            content_abstraction="Executive Abstract: ClipMind AI synthesizes video content using state-of-the-art NLP and speech models.",
            bullet_points_json=json.dumps([
                "Full video pipeline integration with real-time status updates.",
                "OpenAI Whisper speech-to-text with segment timestamps.",
                "BART NLP abstractive summarization with chunking.",
                "Real database analytics and role-based access control."
            ]),
            reading_time_minutes=2
        )
        db.add(demo_summary)

        # Demo Key Moments
        km1 = KeyMomentModel(
            video_id=demo_vid.id,
            title="1. Introduction to ClipMind AI",
            description="Overview of platform objectives, roles, and automated video processing pipeline.",
            start_time=0.0,
            end_time=25.0,
            importance_score=95,
            topic="Introduction",
            keywords_json=json.dumps(["ClipMind", "Video", "AI", "Pipeline"])
        )
        km2 = KeyMomentModel(
            video_id=demo_vid.id,
            title="2. Whisper Speech-to-Text & BART Summarization",
            description="Detailed breakdown of speech segment extraction and abstractive NLP chunking.",
            start_time=25.0,
            end_time=65.0,
            importance_score=92,
            topic="AI Models",
            keywords_json=json.dumps(["Whisper", "BART", "Transcription", "Summarization"])
        )
        km3 = KeyMomentModel(
            video_id=demo_vid.id,
            title="3. Key Moments & Analytics Dashboard",
            description="Automated topic segmentation and live analytics visualization.",
            start_time=65.0,
            end_time=125.5,
            importance_score=88,
            topic="Analytics",
            keywords_json=json.dumps(["Analytics", "Key Moments", "Timestamps"])
        )
        db.add_all([km1, km2, km3])

        # Initial Log
        log = ActivityLogModel(
            user_id=admin.id,
            action="SYSTEM_INIT",
            details="ClipMind AI platform database initialized with sample records and demo roles."
        )
        db.add(log)
        db.commit()

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_initial_data(db)

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/register")
def register(
    user_data: RegisterSchema,
    db: Session = Depends(get_db)
):
    clean_email = user_data.email.strip().lower()

    existing = (
        db.query(UserModel)
        .filter(
            func.lower(UserModel.email) == clean_email
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    display_name = (
        user_data.full_name
        or user_data.name
        or clean_email.split("@")[0]
    )

    raw_role = (
        user_data.role or "CONTENT_CREATOR"
    ).upper()

    valid_public_roles = [
        "CONTENT_CREATOR",
        "LEARNER",
        "EDUCATOR",
    ]

    if raw_role not in valid_public_roles:
        raw_role = "CONTENT_CREATOR"

    new_user = UserModel(
        email=clean_email,
        hashed_password=hash_password(
            user_data.password
        ),
        name=display_name,
        role=raw_role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log = ActivityLogModel(
        user_id=new_user.id,
        action="REGISTER",
        details=f"Registered as {new_user.role}"
    )

    db.add(log)
    db.commit()

    token = create_access_token({
        "sub": new_user.id,
        "email": new_user.email,
        "role": new_user.role
    })

    return {
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "createdAt": (
                new_user.created_at.isoformat()
                if hasattr(
                    new_user.created_at,
                    "isoformat"
                )
                else str(
                    new_user.created_at or ""
                )
            )
        }
    }


@app.post("/auth/login")
def login(
    login_data: LoginSchema,
    db: Session = Depends(get_db)
):
    clean_email = login_data.email.strip().lower()

    # =========================================================
    # 1. DATABASE CONNECTION CHECK
    # =========================================================

    db_conn_succeeded = False

    try:
        db.execute(text("SELECT 1"))
        db_conn_succeeded = True

    except Exception as e:
        print(
            f"[BACKEND AUTH LOG]: DB connection check failed: {e}",
            flush=True
        )

    # =========================================================
    # 2. FIND USER
    # =========================================================

    user = (
        db.query(UserModel)
        .filter(
            func.lower(UserModel.email) == clean_email
        )
        .first()
    )

    user_exists = user is not None

    stored_hash_exists = (
        bool(user.hashed_password)
        if user
        else False
    )

    # =========================================================
    # 3. PASSWORD VERIFICATION
    # =========================================================

    pw_match = False
    failure_reason = None

    if not user:

        failure_reason = (
            "User email not found in database"
        )

    elif not user.hashed_password:

        failure_reason = (
            "User record has missing or empty "
            "stored password hash"
        )

    else:

        try:

            pw_match = verify_password(
                login_data.password,
                user.hashed_password
            )

            if not pw_match:
                failure_reason = (
                    "Password hash mismatch"
                )

        except Exception as pwe:

            failure_reason = (
                f"Password verification exception: {pwe}"
            )

    # =========================================================
    # 4. JWT GENERATION
    # =========================================================

    jwt_status = "Not attempted"
    token = None

    if pw_match and user:

        try:

            token = create_access_token({
                "sub": user.id,
                "email": user.email,
                "role": user.role
            })

            jwt_status = (
                "Success (token generated)"
            )

        except Exception as jwte:

            jwt_status = (
                f"Failed ({jwte})"
            )

    # =========================================================
    # AUTHENTICATION LOG
    # =========================================================

    print(
        "[BACKEND AUTH LOG]:",
        {
            "request_received": "POST /auth/login",
            "normalized_email": clean_email,
            "database_connection_succeeded":
                db_conn_succeeded,
            "user_exists": user_exists,
            "stored_hash_exists":
                stored_hash_exists,
            "password_verification_result":
                (
                    "Success"
                    if pw_match
                    else f"Failed ({failure_reason})"
                ),
            "jwt_generation_result":
                jwt_status
        },
        flush=True
    )

    # =========================================================
    # VALIDATION
    # =========================================================

    if not db_conn_succeeded:

        raise HTTPException(
            status_code=500,
            detail="Database connection error"
        )

    if not user or not pw_match:

        raise HTTPException(
            status_code=400,
            detail="Invalid email or password"
        )

    if not token:

        raise HTTPException(
            status_code=500,
            detail="Failed to generate JWT access token"
        )

    # =========================================================
    # UPDATE LAST LOGIN
    # =========================================================

    user.last_login = datetime.datetime.utcnow()

    try:

        log = ActivityLogModel(
            user_id=user.id,
            action="LOGIN",
            details=(
                "User logged in from browser session"
            )
        )

        db.add(log)
        db.commit()

    except Exception as loge:

        print(
            "[BACKEND AUTH LOG]: "
            f"Failed to write activity log: {loge}",
            flush=True
        )

    # =========================================================
    # RETURN USER
    # =========================================================

    created_at_str = (
        user.created_at.isoformat()
        if hasattr(
            user.created_at,
            "isoformat"
        )
        else str(
            user.created_at or ""
        )
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "createdAt": created_at_str
        }
    }


@app.get("/auth/me")
def get_me(
    current_user: UserModel = Depends(get_current_user)
):
    created_at_str = (
        current_user.created_at.isoformat()
        if hasattr(
            current_user.created_at,
            "isoformat"
        )
        else str(
            current_user.created_at or ""
        )
    )

    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "createdAt": created_at_str
    }

# ==================== VIDEO PROCESSING BACKGROUND PIPELINE ====================

def run_full_ai_pipeline(video_id: str):
    """Executes background video processing: FFmpeg -> Whisper -> BART -> Key Moments"""
    db = SessionLocal()
    try:
        video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
        if not video:
            return

        # 1. FFmpeg Video Processing
        video.status = "PROCESSING_FFMPEG"
        video.progress = 20
        db.commit()

        meta = probe_video(video.file_path)
        video.duration = meta.get("duration", 60.0)
        video.size = meta.get("size", video.size)
        video.metadata_json = json.dumps(meta)

        # Extract audio WAV
        audio_path = os.path.join(UPLOAD_DIR, f"{video_id}_audio.wav")
        extract_audio(video.file_path, audio_path)

        # Generate thumbnail
        thumb_path = os.path.join(UPLOAD_DIR, f"{video_id}_thumb.jpg")
        generate_thumbnail(video.file_path, thumb_path)
        if os.path.exists(thumb_path):
            video.thumbnail_url = f"/uploads/{video_id}_thumb.jpg"

        # 2. Whisper Speech-to-Text Transcription
        video.status = "TRANSCRIBING_WHISPER"
        video.progress = 50
        db.commit()

        whisper_res = process_audio_whisper(audio_path, video.title, video.duration)
        
        # Save Transcript
        existing_transcript = db.query(TranscriptModel).filter(TranscriptModel.video_id == video_id).first()
        if existing_transcript:
            existing_transcript.full_text = whisper_res["fullText"]
            existing_transcript.segments_json = json.dumps(whisper_res["segments"])
        else:
            new_tr = TranscriptModel(
                video_id=video_id,
                language=whisper_res["language"],
                full_text=whisper_res["fullText"],
                segments_json=json.dumps(whisper_res["segments"])
            )
            db.add(new_tr)
        db.commit()

        # 3. BART / DistilBART NLP Summarization
        video.status = "SUMMARIZING_BART"
        video.progress = 75
        db.commit()

        sum_res = summarize_transcript_bart(whisper_res["fullText"], whisper_res["segments"], video.title)
        
        existing_sum = db.query(SummaryModel).filter(SummaryModel.video_id == video_id).first()
        if existing_sum:
            existing_sum.short_summary = sum_res["shortSummary"]
            existing_sum.detailed_summary = sum_res["detailedSummary"]
            existing_sum.content_abstraction = sum_res["contentAbstraction"]
            existing_sum.bullet_points_json = json.dumps(sum_res["bulletPoints"])
            existing_sum.reading_time_minutes = sum_res["readingTimeMinutes"]
        else:
            new_sum = SummaryModel(
                video_id=video_id,
                short_summary=sum_res["shortSummary"],
                detailed_summary=sum_res["detailedSummary"],
                content_abstraction=sum_res["contentAbstraction"],
                bullet_points_json=json.dumps(sum_res["bulletPoints"]),
                reading_time_minutes=sum_res["readingTimeMinutes"]
            )
            db.add(new_sum)
        db.commit()

        # 4. Key Moments & Keywords Detection
        video.status = "DETECTING_KEY_MOMENTS"
        video.progress = 90
        db.commit()

        km_res = detect_key_moments(whisper_res["segments"], video.title, video.duration)
        
        # Clear old key moments
        db.query(KeyMomentModel).filter(KeyMomentModel.video_id == video_id).delete()
        for km in km_res["keyMoments"]:
            new_km = KeyMomentModel(
                video_id=video_id,
                title=km["title"],
                description=km["description"],
                start_time=km["startTime"],
                end_time=km["endTime"],
                importance_score=km["importanceScore"],
                topic=km["topic"],
                keywords_json=json.dumps(km["keywords"])
            )
            db.add(new_km)

        # Complete
        video.status = "COMPLETED"
        video.progress = 100
        db.commit()

        # Clean up temporary audio file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass

    except Exception as e:
        print(f"Error in background AI processing pipeline for video {video_id}: {e}")
        if video:
            video.status = "FAILED"
            db.commit()
    finally:
        db.close()

# ==================== VIDEO ENDPOINTS ====================

@app.post("/videos/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form("General"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "LEARNER":
        raise HTTPException(
            status_code=403,
            detail="Learners are not allowed to upload videos"
        )

    # Validate extension
    ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv", ".flv", ".3gp", ".mpeg", ".mpg", ".ogv"]
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    content_type_looks_like_video = bool(file.content_type) and file.content_type.lower().startswith("video/")

    # Trust the extension when it's on the allow-list; if the extension is
    # missing/unrecognized, fall back to the browser-reported content type
    # instead of hard-rejecting the upload (fixes false "invalid format"
    # rejections for otherwise-valid video files).
    if ext not in ALLOWED_VIDEO_EXTENSIONS and not content_type_looks_like_video:
        raise HTTPException(
            status_code=400,
            detail="Invalid video format. Supported formats: MP4, MOV, AVI, MKV, WEBM, M4V, WMV, FLV, 3GP, MPEG, MPG, OGV"
        )

    # Sanitize and prepare filename
    raw_name = file.filename or "uploaded_video.mp4"
    safe_filename = f"{int(time.time())}_{raw_name.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save file in 1MB chunks with 500MB max size check
    MAX_VIDEO_SIZE_MB = 500
    MAX_SIZE = MAX_VIDEO_SIZE_MB * 1024 * 1024 # 500 MB in bytes
    total_written = 0

    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024): # 1MB chunks
                total_written += len(chunk)
                if total_written > MAX_SIZE:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(status_code=413, detail=f"File size exceeds maximum allowed limit ({MAX_VIDEO_SIZE_MB} MB).")
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Error writing file to disk: {str(e)}")

    file_size = total_written if total_written > 0 else os.path.getsize(file_path)
    video_title = title if title and title.strip() else os.path.splitext(raw_name)[0].replace("_", " ").replace("-", " ").title()

    new_video = VideoModel(
        title=video_title,
        description=description or f"Uploaded video content: {raw_name}",
        file_name=safe_filename,
        file_path=file_path,
        file_url=f"/uploads/{safe_filename}",
        size=file_size,
        status="QUEUED",
        progress=0,
        category=category or "General",
        uploader_id=current_user.id
    )
    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    print("[BACKEND UPLOAD LOG]:", {
        "received filename": file.filename,
        "received content type": file.content_type,
        "received file size": file_size,
        "authenticated user ID": current_user.id,
        "saved file path": file_path,
        "created video ID": new_video.id
    }, flush=True)

    # Log activity
    log = ActivityLogModel(
        user_id=current_user.id,
        action="VIDEO_UPLOAD",
        details=f"Uploaded video '{video_title}' ({round(file_size/(1024*1024), 2)} MB)"
    )
    db.add(log)
    db.commit()

    # Trigger background AI processing pipeline
    background_tasks.add_task(run_full_ai_pipeline, new_video.id)

    return {
        "id": new_video.id,
        "title": new_video.title,
        "status": new_video.status,
        "progress": new_video.progress,
        "fileUrl": new_video.file_url,
        "message": "Video uploaded successfully. AI processing pipeline initiated."
    }

@app.get("/videos")
@app.get("/videos/")
def list_videos(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role == "ADMINISTRATOR":
        videos = (
            db.query(VideoModel)
            .order_by(VideoModel.created_at.desc())
            .all()
        )
    else:
        videos = (
            db.query(VideoModel)
            .filter(VideoModel.uploader_id == current_user.id)
            .order_by(VideoModel.created_at.desc())
            .all()
        )
    result = []
    for v in videos:
        meta = json.loads(v.metadata_json) if v.metadata_json else {}
        result.append({
            "id": v.id,
            "title": v.title,
            "description": v.description,
            "fileName": v.file_name,
            "fileUrl": v.file_url,
            "thumbnailUrl": v.thumbnail_url,
            "duration": v.duration,
            "size": v.size,
            "status": v.status,
            "progress": v.progress,
            "uploaderId": v.uploader_id,
            "uploaderName": v.uploader.name if v.uploader else "Unknown",
            "uploaderRole": v.uploader.role if v.uploader else "LEARNER",
            "category": v.category,
            "createdAt": v.created_at.isoformat(),
            "updatedAt": v.updated_at.isoformat() if v.updated_at else v.created_at.isoformat(),
            "viewsCount": v.views_count,
            "metadata": meta
        })
    return result

@app.get("/videos/{video_id}")
def get_video(video_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.views_count += 1
    db.commit()

    meta = json.loads(video.metadata_json) if video.metadata_json else {}

    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "fileName": video.file_name,
        "fileUrl": video.file_url,
        "thumbnailUrl": video.thumbnail_url,
        "duration": video.duration,
        "size": video.size,
        "status": video.status,
        "progress": video.progress,
        "uploaderId": video.uploader_id,
        "uploaderName": video.uploader.name if video.uploader else "Unknown",
        "uploaderRole": video.uploader.role if video.uploader else "LEARNER",
        "category": video.category,
        "createdAt": video.created_at.isoformat(),
        "updatedAt": video.updated_at.isoformat() if video.updated_at else video.created_at.isoformat(),
        "viewsCount": video.views_count,
        "metadata": meta
    }

@app.put("/videos/{video_id}")
def update_video(
    video_id: str,
    data: VideoUpdateSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    video = db.query(VideoModel).filter(
        VideoModel.id == video_id
    ).first()

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # Only the uploader or administrator can modify the video
    if (
        current_user.role != "ADMINISTRATOR"
        and video.uploader_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this video"
        )

    if data.title:
        video.title = data.title

    if data.description is not None:
        video.description = data.description

    if data.category:
        video.category = data.category

    db.commit()

    return {"message": "Video updated successfully"}


@app.delete("/videos/{video_id}")
def delete_video(video_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if current_user.role != "ADMINISTRATOR" and video.uploader_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this video")

    # Delete local file if exists
    if os.path.exists(video.file_path):
        try:
            os.remove(video.file_path)
        except Exception:
            pass

    db.delete(video)
    db.commit()

    log = ActivityLogModel(user_id=current_user.id, action="VIDEO_DELETE", details=f"Deleted video '{video.title}'")
    db.add(log)
    db.commit()

    return {"message": "Video deleted successfully"}

# ==================== TRANSCRIPT ENDPOINTS ====================

@app.post("/videos/{video_id}/transcribe")
def trigger_transcription(video_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    background_tasks.add_task(run_full_ai_pipeline, video_id)
    return {"message": "Transcription process triggered successfully."}

@app.get("/videos/{video_id}/transcript")
def get_transcript(video_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    transcript = db.query(TranscriptModel).filter(TranscriptModel.video_id == video_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript not found for this video")

    segments = json.loads(transcript.segments_json) if transcript.segments_json else []
    return {
        "id": transcript.id,
        "videoId": transcript.video_id,
        "language": transcript.language,
        "fullText": transcript.full_text,
        "segments": segments,
        "createdAt": transcript.created_at.isoformat()
    }

# ==================== SUMMARY ENDPOINTS ====================

@app.post("/videos/{video_id}/summarize")
def trigger_summarization(video_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    background_tasks.add_task(run_full_ai_pipeline, video_id)
    return {"message": "Summarization process triggered successfully."}

@app.get("/videos/{video_id}/summary")
def get_summary(video_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    summary = db.query(SummaryModel).filter(SummaryModel.video_id == video_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found for this video")

    bullets = json.loads(summary.bullet_points_json) if summary.bullet_points_json else []
    return {
        "id": summary.id,
        "videoId": summary.video_id,
        "shortSummary": summary.short_summary,
        "detailedSummary": summary.detailed_summary,
        "contentAbstraction": summary.content_abstraction,
        "bulletPoints": bullets,
        "readingTimeMinutes": summary.reading_time_minutes,
        "createdAt": summary.created_at.isoformat()
    }

# ==================== KEY MOMENTS ENDPOINTS ====================

@app.post("/videos/{video_id}/key-moments")
def trigger_key_moments(video_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    video = db.query(VideoModel).filter(VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    background_tasks.add_task(run_full_ai_pipeline, video_id)
    return {"message": "Key moments detection process triggered successfully."}

@app.get("/videos/{video_id}/key-moments")
def get_key_moments(video_id: str, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    moments = db.query(KeyMomentModel).filter(KeyMomentModel.video_id == video_id).order_by(KeyMomentModel.start_time.asc()).all()
    result = []
    for m in moments:
        kws = json.loads(m.keywords_json) if m.keywords_json else []
        result.append({
            "id": m.id,
            "videoId": m.video_id,
            "title": m.title,
            "description": m.description,
            "startTime": m.start_time,
            "endTime": m.end_time,
            "importanceScore": m.importance_score,
            "topic": m.topic,
            "keywords": kws
        })
    return result

# ==================== ANALYTICS ENDPOINT ====================


# =========================================================
# CLASSROOM MANAGEMENT
# =========================================================

@app.post("/classrooms")
def create_classroom(
    data: ClassroomCreateSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role(["EDUCATOR"]))
):
    classroom = ClassroomModel(
        name=data.name.strip(),
        description=data.description,
        class_code=f"CM-{uuid.uuid4().hex[:6].upper()}",
        educator_id=current_user.id,
    )

    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return {
        "id": classroom.id,
        "name": classroom.name,
        "description": classroom.description,
        "code": classroom.class_code,
        "educatorId": classroom.educator_id,
        "createdAt": classroom.created_at.isoformat(),
    }


@app.get("/classrooms")
def list_classrooms(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role == "ADMINISTRATOR":
        classrooms = (
            db.query(ClassroomModel)
            .order_by(ClassroomModel.created_at.desc())
            .all()
        )
    elif current_user.role == "EDUCATOR":
        classrooms = (
            db.query(ClassroomModel)
            .filter(ClassroomModel.educator_id == current_user.id)
            .order_by(ClassroomModel.created_at.desc())
            .all()
        )
    else:
        memberships = (
            db.query(ClassroomMemberModel)
            .filter(ClassroomMemberModel.learner_id == current_user.id)
            .all()
        )

        classroom_ids = [m.classroom_id for m in memberships]

        if not classroom_ids:
            classrooms = []
        else:
            classrooms = (
                db.query(ClassroomModel)
                .filter(ClassroomModel.id.in_(classroom_ids))
                .order_by(ClassroomModel.created_at.desc())
                .all()
            )

    return [
        {
            "id": classroom.id,
            "name": classroom.name,
            "description": classroom.description,
            "code": classroom.class_code,
            "educatorId": classroom.educator_id,
            "educatorName": (
                classroom.educator.name
                if classroom.educator
                else "Unknown"
            ),
            "students": len(classroom.members),
            "videos": len(classroom.videos),
            "assignments": len(classroom.assignments),
            "createdAt": classroom.created_at.isoformat(),
            "updatedAt": (
                classroom.updated_at.isoformat()
                if classroom.updated_at
                else classroom.created_at.isoformat()
            ),
        }
        for classroom in classrooms
    ]

# =========================================================
# EDUCATOR STUDENTS
# =========================================================

@app.get("/educator/students")
def get_educator_students(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(
        require_role(["EDUCATOR"])
    )
):
    """
    Return learners enrolled in classrooms
    owned by the logged-in educator.
    """

    rows = (
        db.query(
            UserModel.id,
            UserModel.name,
            UserModel.email,
            ClassroomModel.id.label("classroom_id"),
            ClassroomModel.name.label("classroom_name"),
            ClassroomMemberModel.joined_at,
        )
        .join(
            ClassroomMemberModel,
            ClassroomMemberModel.learner_id == UserModel.id
        )
        .join(
            ClassroomModel,
            ClassroomModel.id == ClassroomMemberModel.classroom_id
        )
        .filter(
            ClassroomModel.educator_id == current_user.id,
            UserModel.role == "LEARNER",
        )
        .order_by(
            ClassroomModel.name.asc(),
            UserModel.name.asc()
        )
        .all()
    )

    return [
        {
            "id": row.id,
            "name": row.name,
            "email": row.email,
            "classroomId": row.classroom_id,
            "classroom": row.classroom_name,
            "joinedAt": (
                row.joined_at.isoformat()
                if row.joined_at
                else None
            ),
        }
        for row in rows
    ]


# =========================================================
# CLASSROOM CODE RESOLUTION
# =========================================================

@app.get("/classrooms/code/{code}")
def get_classroom_by_code(
    code: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Resolve a classroom using the join code."""

    if current_user.role != "LEARNER":
        raise HTTPException(
            status_code=403,
            detail="Only learners can resolve classroom codes"
        )

    clean_code = code.strip().upper()

    if not clean_code:
        raise HTTPException(
            status_code=400,
            detail="Classroom code is required"
        )

    classroom = (
        db.query(ClassroomModel)
        .filter(
            func.upper(ClassroomModel.class_code) == clean_code
        )
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found. Please check the classroom code."
        )

    return {
        "id": classroom.id,
        "name": classroom.name,
        "description": classroom.description,
        "code": classroom.class_code,
        "educatorId": classroom.educator_id,
        "educatorName": (
            classroom.educator.name
            if classroom.educator
            else "Unknown"
        ),
    }


@app.post("/classrooms/{classroom_id}/join")
def join_classroom(
    classroom_id: str,
    data: ClassroomJoinSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role != "LEARNER":
        raise HTTPException(
            status_code=403,
            detail="Only learners can join classrooms"
        )

    classroom = (
        db.query(ClassroomModel)
        .filter(
            ClassroomModel.id == classroom_id,
            ClassroomModel.class_code == data.code.strip().upper()
        )
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found or classroom code is incorrect"
        )

    existing_member = (
        db.query(ClassroomMemberModel)
        .filter(
            ClassroomMemberModel.classroom_id == classroom.id,
            ClassroomMemberModel.learner_id == current_user.id
        )
        .first()
    )

    if existing_member:
        return {
            "message": "Already joined this classroom",
            "classroomId": classroom.id,
            "name": classroom.name,
            "code": classroom.class_code
        }

    membership = ClassroomMemberModel(
        classroom_id=classroom.id,
        learner_id=current_user.id
    )

    db.add(membership)
    db.commit()

    return {
        "message": "Joined classroom successfully",
        "classroomId": classroom.id,
        "name": classroom.name,
        "code": classroom.class_code
    }

@app.get("/classrooms/{classroom_id}")
def get_classroom(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    classroom = (
        db.query(ClassroomModel)
        .filter(ClassroomModel.id == classroom_id)
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    is_admin = current_user.role == "ADMINISTRATOR"
    is_educator = (
        current_user.role == "EDUCATOR"
        and classroom.educator_id == current_user.id
    )

    is_member = (
        db.query(ClassroomMemberModel)
        .filter(
            ClassroomMemberModel.classroom_id == classroom_id,
            ClassroomMemberModel.learner_id == current_user.id,
        )
        .first()
        is not None
    )

    if not (is_admin or is_educator or is_member):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this classroom"
        )

    return {
        "id": classroom.id,
        "name": classroom.name,
        "description": classroom.description,
        "code": classroom.class_code,
        "educatorId": classroom.educator_id,
        "educatorName": (
            classroom.educator.name
            if classroom.educator
            else "Unknown"
        ),
        "students": len(classroom.members),
        "videos": len(classroom.videos),
        "assignments": len(classroom.assignments),
        "createdAt": classroom.created_at.isoformat(),
        "updatedAt": (
            classroom.updated_at.isoformat()
            if classroom.updated_at
            else classroom.created_at.isoformat()
        ),
    }


@app.post("/classrooms/{classroom_id}/videos/{video_id}")
def share_video_to_classroom(
    classroom_id: str,
    video_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role(["EDUCATOR"]))
):
    # Only the classroom's educator can share content.
    classroom = (
        db.query(ClassroomModel)
        .filter(
            ClassroomModel.id == classroom_id,
            ClassroomModel.educator_id == current_user.id
        )
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found or you are not the classroom educator"
        )

    video = (
        db.query(VideoModel)
        .filter(VideoModel.id == video_id)
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Video not found"
        )

    # Only allow the educator to share videos they uploaded.
    if video.uploader_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only share videos that you uploaded"
        )

    existing = (
        db.query(ClassroomVideoModel)
        .filter(
            ClassroomVideoModel.classroom_id == classroom_id,
            ClassroomVideoModel.video_id == video_id
        )
        .first()
    )

    if existing:
        return {
            "message": "Video is already shared with this classroom",
            "classroomId": classroom_id,
            "videoId": video_id
        }

    classroom_video = ClassroomVideoModel(
        classroom_id=classroom_id,
        video_id=video_id
    )

    db.add(classroom_video)
    db.commit()
    db.refresh(classroom_video)

    return {
        "message": "Video shared with classroom successfully",
        "classroomId": classroom_id,
        "videoId": video_id,
        "sharedAt": classroom_video.shared_at.isoformat()
    }


@app.get("/classrooms/{classroom_id}/videos")
def get_classroom_videos(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    classroom = (
        db.query(ClassroomModel)
        .filter(ClassroomModel.id == classroom_id)
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    is_admin = current_user.role == "ADMINISTRATOR"

    is_educator = (
        current_user.role == "EDUCATOR"
        and classroom.educator_id == current_user.id
    )

    is_member = (
        db.query(ClassroomMemberModel)
        .filter(
            ClassroomMemberModel.classroom_id == classroom_id,
            ClassroomMemberModel.learner_id == current_user.id
        )
        .first()
        is not None
    )

    if not (is_admin or is_educator or is_member):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this classroom"
        )

    classroom_videos = (
        db.query(ClassroomVideoModel)
        .filter(
            ClassroomVideoModel.classroom_id == classroom_id
        )
        .order_by(ClassroomVideoModel.shared_at.desc())
        .all()
    )

    result = []

    for item in classroom_videos:
        video = item.video

        if not video:
            continue

        result.append({
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "fileName": video.file_name,
            "fileUrl": video.file_url,
            "thumbnailUrl": video.thumbnail_url,
            "duration": video.duration,
            "size": video.size,
            "status": video.status,
            "progress": video.progress,
            "category": video.category,
            "viewsCount": video.views_count,
            "sharedAt": (
                item.shared_at.isoformat()
                if item.shared_at
                else None
            )
        })

    return result


@app.put("/classrooms/{classroom_id}")
def update_classroom(
    classroom_id: str,
    data: ClassroomUpdateSchema,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role(["EDUCATOR"]))
):
    classroom = (
        db.query(ClassroomModel)
        .filter(ClassroomModel.id == classroom_id)
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    if (
        current_user.role != "ADMINISTRATOR"
        and classroom.educator_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to modify this classroom"
        )

    if data.name is not None and data.name.strip():
        classroom.name = data.name.strip()

    if data.description is not None:
        classroom.description = data.description

    db.commit()
    db.refresh(classroom)

    return {
        "message": "Classroom updated successfully",
        "id": classroom.id,
        "name": classroom.name,
        "description": classroom.description,
        "code": classroom.class_code,
    }


@app.delete("/classrooms/{classroom_id}")
def delete_classroom(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role(["EDUCATOR"]))
):
    classroom = (
        db.query(ClassroomModel)
        .filter(ClassroomModel.id == classroom_id)
        .first()
    )

    if not classroom:
        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    if (
        current_user.role != "ADMINISTRATOR"
        and classroom.educator_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this classroom"
        )

    db.delete(classroom)
    db.commit()

    return {
        "message": "Classroom deleted successfully"
    }




@app.get("/classrooms/{classroom_id}/assignments")
def get_classroom_assignments(
    classroom_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    classroom = db.query(ClassroomModel).filter(ClassroomModel.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    is_admin = current_user.role == "ADMINISTRATOR"
    is_educator = current_user.role == "EDUCATOR" and classroom.educator_id == current_user.id
    is_member = (
        db.query(ClassroomMemberModel)
        .filter(
            ClassroomMemberModel.classroom_id == classroom_id,
            ClassroomMemberModel.learner_id == current_user.id,
        )
        .first()
        is not None
    )
    if not (is_admin or is_educator or is_member):
        raise HTTPException(status_code=403, detail="You do not have access to this classroom")

    assignments = (
        db.query(AssignmentModel)
        .filter(AssignmentModel.classroom_id == classroom_id)
        .order_by(AssignmentModel.created_at.desc())
        .all()
    )
    now = datetime.datetime.utcnow()
    return [
        {
            "id": a.id,
            "classroomId": a.classroom_id,
            "classroom": classroom.name,
            "videoId": a.video_id,
            "videoTitle": a.video.title if a.video else None,
            "title": a.title,
            "description": a.description,
            "dueDate": a.due_date.isoformat() if a.due_date else None,
            "createdAt": a.created_at.isoformat() if a.created_at else None,
            "status": "Active" if (not a.due_date or a.due_date >= now) else "Overdue",
        }
        for a in assignments
    ]


@app.put("/educator/assignments/{assignment_id}")
def update_educator_assignment(
    assignment_id: str,
    payload: dict,
    current_user: UserModel = Depends(require_role(["EDUCATOR"])),
):
    db = SessionLocal()
    try:
        assignment = (
            db.query(AssignmentModel)
            .join(ClassroomModel, AssignmentModel.classroom_id == ClassroomModel.id)
            .filter(
                AssignmentModel.id == assignment_id,
                ClassroomModel.educator_id == current_user.id,
            )
            .first()
        )
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        if "title" in payload:
            title = (payload.get("title") or "").strip()
            if not title:
                raise HTTPException(status_code=400, detail="title is required")
            assignment.title = title

        if "description" in payload:
            assignment.description = payload.get("description")

        if "dueDate" in payload:
            due_value = payload.get("dueDate")
            if not due_value:
                assignment.due_date = None
            else:
                try:
                    assignment.due_date = datetime.datetime.fromisoformat(due_value)
                except (TypeError, ValueError):
                    raise HTTPException(status_code=400, detail="Invalid dueDate")

        if "videoId" in payload:
            video_id = payload.get("videoId")
            if video_id:
                video = (
                    db.query(VideoModel)
                    .filter(
                        VideoModel.id == video_id,
                        VideoModel.uploader_id == current_user.id,
                    )
                    .first()
                )
                if not video:
                    raise HTTPException(status_code=404, detail="Video not found or you do not own this video")
                shared = (
                    db.query(ClassroomVideoModel)
                    .filter(
                        ClassroomVideoModel.classroom_id == assignment.classroom_id,
                        ClassroomVideoModel.video_id == video_id,
                    )
                    .first()
                )
                if not shared:
                    raise HTTPException(status_code=400, detail="The selected video must be shared with this classroom first")
            assignment.video_id = video_id

        db.commit()
        db.refresh(assignment)
        return {
            "message": "Assignment updated successfully",
            "id": assignment.id,
            "classroomId": assignment.classroom_id,
            "videoId": assignment.video_id,
            "videoTitle": assignment.video.title if assignment.video else None,
            "title": assignment.title,
            "description": assignment.description,
            "dueDate": assignment.due_date.isoformat() if assignment.due_date else None,
            "createdAt": assignment.created_at.isoformat() if assignment.created_at else None,
            "status": "Active" if (not assignment.due_date or assignment.due_date >= datetime.datetime.utcnow()) else "Overdue",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[EDUCATOR ASSIGNMENT UPDATE ERROR]: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to update assignment")
    finally:
        db.close()


@app.delete("/educator/assignments/{assignment_id}")
def delete_educator_assignment(
    assignment_id: str,
    current_user: UserModel = Depends(require_role(["EDUCATOR"])),
):
    db = SessionLocal()
    try:
        assignment = (
            db.query(AssignmentModel)
            .join(ClassroomModel, AssignmentModel.classroom_id == ClassroomModel.id)
            .filter(
                AssignmentModel.id == assignment_id,
                ClassroomModel.educator_id == current_user.id,
            )
            .first()
        )
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        db.delete(assignment)
        db.commit()
        return {"message": "Assignment deleted successfully", "id": assignment_id}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"[EDUCATOR ASSIGNMENT DELETE ERROR]: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to delete assignment")
    finally:
        db.close()


@app.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role == "ADMINISTRATOR":
        return compute_platform_analytics(db)

    return compute_user_analytics(
        db,
        current_user.id
    )


# API alias used by the frontend analytics service
@app.get("/api/analytics")
def get_api_analytics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if current_user.role == "ADMINISTRATOR":
        return compute_platform_analytics(db)

    return compute_user_analytics(
        db,
        current_user.id
    )

# ==================== USER MANAGEMENT & ADMIN ====================

@app.get("/users")
def list_users(db: Session = Depends(get_db), current_user: UserModel = Depends(require_role(["ADMINISTRATOR"]))):
    users = db.query(UserModel).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "createdAt": u.created_at.isoformat(),
            "lastLogin": u.last_login.isoformat() if hasattr(u.last_login, 'isoformat') else str(u.last_login) if u.last_login else "Never"
        }
        for u in users
    ]

@app.put("/users/{user_id}/role")
def update_user_role(user_id: str, data: RoleUpdateSchema, db: Session = Depends(get_db), current_user: UserModel = Depends(require_role(["ADMINISTRATOR"]))):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = data.role
    db.commit()

    log = ActivityLogModel(user_id=current_user.id, action="ROLE_UPDATE", details=f"Changed user '{user.name}' role to {data.role}")
    db.add(log)
    db.commit()

    return {"message": "User role updated successfully"}


# ==================== ADMIN ACTIVITY LOGS ====================

@app.get("/admin/activity")
def get_admin_activity(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(
        require_role(["ADMINISTRATOR"])
    )
):
    logs = (
        db.query(ActivityLogModel)
        .order_by(ActivityLogModel.timestamp.desc())
        .limit(200)
        .all()
    )

    result = []

    for log in logs:
        result.append({
            "id": log.id,
            "userId": log.user_id,
            "userName": log.user.name if log.user else "System",
            "userEmail": log.user.email if log.user else "",
            "action": log.action,
            "details": log.details,
            "timestamp": (
                log.timestamp.isoformat()
                if hasattr(log.timestamp, "isoformat")
                else str(log.timestamp or "")
            ),
        })

    return result

# ==================== BOOKMARKS ====================

@app.post("/bookmarks")
def create_bookmark(data: BookmarkSchema, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    new_bm = BookmarkModel(
        user_id=current_user.id,
        video_id=data.videoId,
        type=data.type,
        content_snippet=data.contentSnippet,
        timestamp_sec=data.timestampSec
    )
    db.add(new_bm)
    db.commit()
    db.refresh(new_bm)

    return {"id": new_bm.id, "message": "Bookmark saved"}

@app.get("/bookmarks")
def list_bookmarks(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    bms = db.query(BookmarkModel).filter(BookmarkModel.user_id == current_user.id).order_by(BookmarkModel.created_at.desc()).all()
    return [
        {
            "id": b.id,
            "userId": b.user_id,
            "videoId": b.video_id,
            "videoTitle": b.video.title if b.video else "Video",
            "type": b.type,
            "contentSnippet": b.content_snippet,
            "timestampSec": b.timestamp_sec,
            "createdAt": b.created_at.isoformat()
        }
        for b in bms
    ]
    # ==================== ADMIN ACTIVITY LOGS ====================

@app.get("/admin/activity")
def get_activity_logs(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(
        require_role(["ADMINISTRATOR"])
    )
):
    logs = (
        db.query(ActivityLogModel)
        .order_by(ActivityLogModel.timestamp.desc())
        .limit(200)
        .all()
    )

    return [
        {
            "id": log.id,
            "userId": log.user_id,
            "userName": log.user.name if log.user else "System",
            "userEmail": log.user.email if log.user else "",
            "action": log.action,
            "details": log.details,
            "timestamp": (
                log.timestamp.isoformat()
                if hasattr(log.timestamp, "isoformat")
                else str(log.timestamp or "")
            ),
        }
        for log in logs
    ]
@app.get("/educator/assignments")
def get_educator_assignments(
    current_user: UserModel = Depends(
        require_role("EDUCATOR")
    ),
):
    db = SessionLocal()

    try:
        assignments = (
            db.query(AssignmentModel)
            .join(
                ClassroomModel,
                AssignmentModel.classroom_id
                == ClassroomModel.id
            )
            .filter(
                ClassroomModel.educator_id
                == current_user.id
            )
            .order_by(
                AssignmentModel.created_at.desc()
            )
            .all()
        )

        return [
            {
                "id": assignment.id,
                "classroomId": assignment.classroom_id,
                "classroom": (
                    assignment.classroom.name
                    if assignment.classroom
                    else None
                ),
                "videoId": assignment.video_id,
                "videoTitle": assignment.video.title if assignment.video else None,
                "title": assignment.title,
                "description": assignment.description,
                "dueDate": (
                    assignment.due_date.isoformat()
                    if assignment.due_date
                    else None
                ),
                "createdAt": (
                    assignment.created_at.isoformat()
                    if assignment.created_at
                    else None
                ),
                "status": (
                    "Active"
                    if (
                        not assignment.due_date
                        or assignment.due_date >= datetime.datetime.utcnow()
                    )
                    else "Completed"
                ),
            }
            for assignment in assignments
        ]

    finally:
        db.close()


@app.post("/educator/assignments")
def create_educator_assignment(
    payload: dict,
    current_user: UserModel = Depends(
        require_role("EDUCATOR")
    ),
):
    db = SessionLocal()

    try:
        classroom_id = payload.get("classroomId")
        title = (payload.get("title") or "").strip()
        description = payload.get("description")
        due_date_value = payload.get("dueDate")

        if not classroom_id:
            raise HTTPException(
                status_code=400,
                detail="classroomId is required"
            )

        if not title:
            raise HTTPException(
                status_code=400,
                detail="title is required"
            )

        classroom = (
            db.query(ClassroomModel)
            .filter(
                ClassroomModel.id == classroom_id,
                ClassroomModel.educator_id
                == current_user.id,
            )
            .first()
        )

        if not classroom:
            raise HTTPException(
                status_code=404,
                detail="Classroom not found"
            )

        due_date = None

        if due_date_value:
            try:
                due_date = datetime.datetime.fromisoformat(
                    due_date_value
                )
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid dueDate"
                )

        video_id = payload.get("videoId")
        video = None
        if video_id:
            video = (
                db.query(VideoModel)
                .filter(
                    VideoModel.id == video_id,
                    VideoModel.uploader_id == current_user.id,
                )
                .first()
            )
            if not video:
                raise HTTPException(
                    status_code=404,
                    detail="Video not found or you do not own this video",
                )

            shared = (
                db.query(ClassroomVideoModel)
                .filter(
                    ClassroomVideoModel.classroom_id == classroom.id,
                    ClassroomVideoModel.video_id == video.id,
                )
                .first()
            )
            if not shared:
                raise HTTPException(
                    status_code=400,
                    detail="The selected video must be shared with this classroom first",
                )

        assignment = AssignmentModel(
            classroom_id=classroom.id,
            video_id=video_id,
            title=title,
            description=description,
            due_date=due_date,
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return {
            "id": assignment.id,
            "classroomId": assignment.classroom_id,
            "classroom": classroom.name,
            "videoId": assignment.video_id,
            "videoTitle": video.title if video else None,
            "title": assignment.title,
            "description": assignment.description,
            "dueDate": (
                assignment.due_date.isoformat()
                if assignment.due_date
                else None
            ),
            "createdAt": (
                assignment.created_at.isoformat()
                if assignment.created_at
                else None
            ),
            "status": "Active",
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        print(
            f"[EDUCATOR ASSIGNMENT ERROR]: {e}",
            flush=True
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create assignment"
        )

    finally:
        db.close()