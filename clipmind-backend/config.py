import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",") if o.strip()]

UPLOAD_DIR = os.path.join(BASE_DIR, os.getenv("UPLOAD_DIR", "data/uploads"))
AUDIO_DIR = os.path.join(BASE_DIR, os.getenv("AUDIO_DIR", "data/audio"))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'data', 'clipmind.db')}")

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "tiny")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "1024"))

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v",
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg",
}
