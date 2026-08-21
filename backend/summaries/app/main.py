from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.database import engine, Base

# Import all models
from app.database import base

# ==========================================
# Routers
# ==========================================

from app.api.auth import router as auth_router
from app.api.upload import router as upload_router
from app.api.dashboard import router as dashboard_router
from app.api.transcript import router as transcript_router
from app.api.summary import router as summary_router
from app.api.key_moments import router as key_moment_router
from app.api.analytics import router as analytics_router
from app.api.keyword import router as keyword_router
from app.api.chat import router as chat_router
from app.api.search import router as search_router   # NEW

# ==========================================
# Create Database Tables
# ==========================================

Base.metadata.create_all(bind=engine)

# ==========================================
# FastAPI App
# ==========================================

app = FastAPI(
    title="ClipMind AI API",
    version="1.0.0",
    description="AI Powered Video Intelligence Platform"
)

# ==========================================
# CORS Configuration
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
# Register API Routers
# ==========================================

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(dashboard_router)
app.include_router(transcript_router)
app.include_router(summary_router)
app.include_router(key_moment_router)
app.include_router(analytics_router)
app.include_router(keyword_router)
app.include_router(chat_router)
app.include_router(search_router)   # NEW

# ==========================================
# Root Endpoint
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Welcome to ClipMind AI API",
        "version": "1.0.0",
        "status": "Running"
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
        "version": "1.0.0"
    }

# ==========================================
# API Information
# ==========================================

@app.get("/api-info")
def api_info():
    return {
        "project": "ClipMind AI",
        "features": [
            "Authentication",
            "Video Upload",
            "Transcript Generation",
            "AI Summary",
            "Key Moments Detection",
            "Keyword Extraction",
            "Analytics Dashboard",
            "AI Chat",
            "Smart Search"      # NEW
        ],
        "docs": "/docs",
        "redoc": "/redoc"
    }