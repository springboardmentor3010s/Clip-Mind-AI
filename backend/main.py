from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import Base, engine
from routes.auth_routes import router as auth_router
from routes.upload_routes import router as upload_router
from routes.process_routes import router as process_router
from routes.summary_routes import router as summary_router
from routes.transcript_routes import router as transcript_router
from routes.videos import router as videos_router


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="ClipMind AI API",
    version="1.0"
)


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# UPLOADS DIRECTORY
# ==========================================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

print("================================")
print("MAIN FILE:", Path(__file__).resolve())
print("UPLOAD DIRECTORY:", UPLOAD_DIR)
print(
    "UPLOAD DIRECTORY EXISTS:",
    UPLOAD_DIR.exists()
)

print("FILES IN UPLOAD DIRECTORY:")

if UPLOAD_DIR.exists():
    for file in UPLOAD_DIR.iterdir():
        print("  -", file.name)

print(
    "DEF SCIENCE EXISTS:",
    (UPLOAD_DIR / "Def Science.mp4").exists()
)

print("================================")


app.mount(
    "/uploads",
    StaticFiles(
        directory=str(UPLOAD_DIR)
    ),
    name="uploads"
)


# ==========================================
# DATABASE
# ==========================================

Base.metadata.create_all(
    bind=engine
)


# ==========================================
# ROUTERS
# ==========================================

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(process_router)
app.include_router(summary_router)
app.include_router(transcript_router)
app.include_router(videos_router)


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():
    return {
        "message":
        "Welcome to ClipMind AI Backend"
    }