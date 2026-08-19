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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra="ignore")

import os

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

settings = Settings()
