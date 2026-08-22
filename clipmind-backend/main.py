from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import config
from models.database import init_db, get_db
from models.db_models import Video
from services import pipeline

from routes import auth, videos, transcript, summary, moments, analytics, history, activity

app = FastAPI(
    title="ClipMind AI API",
    description="Local FastAPI backend for the ClipMind AI video summarization platform.",
    version="1.0.0",
)

# --- CORS: allow the React (Vite) frontend to call this API locally ---------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "https://clipmind-ai-od4w.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# --- health checks -----------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "ClipMind AI API"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


# --- route registration --------------------------------------------------
# All routes are mounted under /api to match the frontend's default
# axios baseURL (`src/services/api.ts` -> VITE_API_URL || "/api").
app.include_router(videos.router, prefix="/api")
app.include_router(transcript.router, prefix="/api")
app.include_router(summary.router, prefix="/api")
app.include_router(moments.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


# --- convenience: run the full pipeline (transcript -> summary -> moments ->
# analytics) in one call. Not required by the frontend contract, but handy
# for local testing (curl / Swagger UI) instead of firing 4 requests by hand.
@app.post("/api/process/{video_id}")
def process_video(video_id: str, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found.")
    try:
        video = pipeline.run_full_pipeline(db, video)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {e}") from e
    return video.to_record()
