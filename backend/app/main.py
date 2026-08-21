from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine, Base

# ==========================================
# Import Models
# ==========================================
from app.database import base

# ==========================================
# Import Routers
# ==========================================
from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.dashboard import router as dashboard_router
from app.api.transcript import router as transcript_router
from app.api.summary import router as summary_router
from app.api.key_moments import router as key_moment_router
from app.api.keyword import router as keyword_router
from app.api.analytics import router as analytics_router
from app.api.chat import router as chat_router
from app.api.search import router as search_router
from app.api.bookmark import router as bookmark_router
from app.api.learning_history import router as learning_history_router
from app.api.watch_video import router as watch_video_router
from app.api.available_videos import router as available_videos_router
from app.api.admin import router as admin_router
from app.api.educator import router as educator_router
from app.api.share import router as share_router
from app.api.material import router as material_router
    
from app.api.classroom import router as classroom_router
# ==========================================
# Milestone 4 - Learner Module
# ==========================================
from app.api.learner import router as learner_router

# ==========================================
# Create Database Tables
# ==========================================
Base.metadata.create_all(bind=engine)

# ==========================================
# FastAPI App
# ==========================================
app = FastAPI(
    title="ClipMind AI API",
    version="2.0.0",
    description="AI Powered Video Intelligence Platform"
)

# ==========================================
# CORS
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:5502",
        "http://localhost:5502",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Static Files
# ==========================================
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

# ==========================================
# Register Routers
# ==========================================
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(dashboard_router)
app.include_router(transcript_router)
app.include_router(summary_router)
app.include_router(key_moment_router)
app.include_router(keyword_router)
app.include_router(analytics_router)
app.include_router(chat_router)
app.include_router(search_router)
app.include_router(bookmark_router)
app.include_router(learning_history_router)
app.include_router(watch_video_router)
app.include_router(available_videos_router)
app.include_router(admin_router)
app.include_router(educator_router)
app.include_router(share_router)
app.include_router(classroom_router)
app.include_router(material_router)


# ==========================================
# Learner Module
# ==========================================
app.include_router(learner_router)

# ==========================================
# Root
# ==========================================
@app.get("/")
def root():
    return {
        "project": "ClipMind AI",
        "version": "2.0.0",
        "status": "Running",
        "message": "Welcome to ClipMind AI Backend"
    }

# ==========================================
# Health Check
# ==========================================
@app.get("/health")
def health():
    return {
        "status": "Healthy",
        "database": "Connected",
        "service": "ClipMind AI Backend",
        "version": "2.0.0"
    }

# ==========================================
# API Information
# ==========================================
@app.get("/api-info")
def api_info():
    return {
        "project": "ClipMind AI",
        "version": "2.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "modules": {
            "Authentication": [
                "Register",
                "Login",
                "JWT Authentication"
            ],
            "Video Intelligence": [
                "Video Upload",
                "Transcript Generation",
                "AI Summary",
                "Key Moments Detection",
                "Keyword Extraction",
                "Analytics Dashboard",
                "AI Chat",
                "Smart Search"
            ],
            "Learner Module": [
                "Browse Available Videos",
                "Watch Videos",
                "Read AI Summaries",
                "View Transcripts",
                "View Key Moments",
                "Search Videos",
                "Bookmark Videos",
                "Learning History"
            ]
        }
    }