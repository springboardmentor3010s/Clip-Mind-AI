"""
Central configuration for ClipMind AI backend.
All values are loaded from the .env file so nothing sensitive is hard-coded.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "ClipMind AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str

    # ---- MongoDB ----
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "clipmind_ai"

    # ---- Google OAuth ----
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/api/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:3000"
    STORAGE_TYPE: str = "local"
    LOCAL_STORAGE_PATH: str = "./storage/videos"
    THUMBNAIL_STORAGE_PATH: str = "./storage/thumbnails"
    MAX_UPLOAD_SIZE_MB: int = 2048
    ALLOWED_VIDEO_FORMATS: str = "mp4,mov,avi,webm"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

    @property
    def allowed_formats_list(self) -> list[str]:
        return [f.strip().lower() for f in self.ALLOWED_VIDEO_FORMATS.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()