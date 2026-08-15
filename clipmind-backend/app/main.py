from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.api.key_moment import router as key_moment_router

from app.api.highlight_report import router as highlight_report_router
from app.api.keyword import router as keyword_router
from app.api.analytics import router as analytics_router
from app.api.usage_analytics import router as usage_analytics_router

from app.database.base import Base
from app.database.connection import engine

from app.models.user import User
from app.models.video import Video
from app.models.activity_history import ActivityHistory
from app.models.transcript import Transcript
from app.models.summary import Summary
from app.models.transcript_segment import TranscriptSegment
from app.models.key_moment import KeyMoment
from app.models.keyword import Keyword

app = FastAPI(
    title="ClipMind AI Backend",
    description="Backend API for ClipMind AI",
    version="1.0.0"
)

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# -----------------------------
# Serve static files
# -----------------------------
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)

app.mount(
    "/thumbnails",
    StaticFiles(directory="thumbnails"),
    name="thumbnails"
)

app.mount(
    "/audio",
    StaticFiles(directory="audio"),
    name="audio"
)

# Include all API routes
app.include_router(router)

app.include_router(key_moment_router)

app.include_router(highlight_report_router)

app.include_router(keyword_router)

app.include_router(
    analytics_router
)

app.include_router(
    usage_analytics_router
)