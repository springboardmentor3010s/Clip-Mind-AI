# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 1. Import base core dependencies
from app.core.database import engine, Base

# 2. Explicitly import models here to register them with metadata before running migrations 🌟
from app.models.user import User
from app.models.video import VideoMetadata

# 3. Create tables instantly
Base.metadata.create_all(bind=engine)

# 4. Import routers
from app.routers import auth, video

app = FastAPI(title="ClipMind AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(video.router)
# 3. Simple root health-check route
@app.get("/")
def read_root():
    return {
        "status": "online",
        "platform": "ClipMind AI Core Service",
        "milestone": 1
    }

# In backend/app/main.py
from app.routers import auth

app.include_router(auth.router)