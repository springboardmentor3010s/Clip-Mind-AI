from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.routes.users import router as users_router
from app.database import Base, engine
from app.models import User, Video 
from app.routes.video import router as video_router

from app.routes.auth import router as auth_router
# Create all database tables
print(Base.metadata.tables.keys())
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ClipMind AI Backend"
)
# Allow frontend to access backend
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
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(video_router)
@app.get("/")
def home():
    return {
        "message": "ClipMind AI Backend is running!"
    }