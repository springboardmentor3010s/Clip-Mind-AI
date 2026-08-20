from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str = "clipmind-ai-super-secret-key-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    database_url: str = "postgresql://postgres:postgres123@localhost:5432/clipmind"
    redis_url: str = "redis://localhost:6379/0"

    r2_access_key_id: str
    r2_secret_access_key: str
    r2_account_id: str
    r2_bucket_name: str
    r2_public_url: str = ""

    firebase_project_id: str = "clipmind-ai-firebase-gagana"

    # Comma-separated list of extra allowed CORS origins, e.g. a deployment's
    # public IP/domain — http://localhost:3000 and 127.0.0.1:3000 are always
    # allowed regardless, for local dev.
    extra_cors_origins: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        base = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
        extra = [o.strip() for o in self.extra_cors_origins.split(",") if o.strip()]
        return base + extra

import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

settings = Settings()
