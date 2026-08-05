"""
Centralized application configuration.
Loads values from environment variables / .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ClipMind AI"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Postgres
    DATABASE_URL: str

    # Mongo
    MONGO_URI: str
    MONGO_DB_NAME: str = "clipmind_content"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 2048

    # CORS - comma separated origins in env, parsed to list
    CORS_ORIGINS: str = "http://localhost:3000"

    # SMTP / transactional email (used for password reset)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "no-reply@clipmind.ai"

    # Frontend base URL — used to build links embedded in emails
    FRONTEND_URL: str = "http://localhost:3000"

    # Password reset
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance so we only parse the environment once."""
    return Settings()


settings = get_settings()
