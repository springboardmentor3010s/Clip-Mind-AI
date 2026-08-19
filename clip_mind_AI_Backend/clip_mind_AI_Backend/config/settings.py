"""
ClipMind AI — Production-ready Django settings.
Secrets are loaded from .env via python-decouple (never hardcoded).
"""

import sys
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

#: True while `manage.py test` is running.
TESTING = "test" in sys.argv

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = config("SECRET_KEY", default="change-me-in-production")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="127.0.0.1,localhost", cast=Csv())

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

# ---------------------------------------------------------------------------
# Installed Apps
# ---------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "drf_spectacular",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.videos",
    "apps.processing",
    "apps.transcripts",
    "apps.summaries",
    "apps.analytics",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # WhiteNoise serves collected static files (admin + Swagger UI assets)
    # directly from Gunicorn, so no separate web server is needed in a container.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database — PostgreSQL
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="clipmind_ai"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

# ---------------------------------------------------------------------------
# Password validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media files
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

UPLOADS_ROOT = BASE_DIR / "uploads"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "core.exception_handler.custom_exception_handler",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
        # Public contact form — unauthenticated and sends mail, so it needs a
        # much tighter per-IP limit than general anonymous traffic.
        "contact": "5/hour",
    },
}

# ---------------------------------------------------------------------------
# SimpleJWT
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    # config() returns "" when the key exists but is blank in .env;
    # the 'or SECRET_KEY' fallback ensures we never sign tokens with an empty key.
    "SIGNING_KEY": config("JWT_SECRET", default="") or SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Cache — Redis via Memurai (Windows-compatible Redis-protocol server)
# Memurai uses standard Redis protocol so no URL changes are needed.
# DB 1 is reserved for the cache; DB 0 is used by Celery.
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": config("REDIS_CACHE_URL", default="redis://localhost:6379/1"),
    }
}

# ---------------------------------------------------------------------------
# Celery — Memurai broker (Redis-protocol compatible)
# Use DB 0 for Celery broker/results so it is isolated from the cache.
# On Windows, start the worker with: celery -A config worker --pool=solo -l info
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 3600  # 1 hour max per task

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default=config("EMAIL_HOST_USER", default="noreply@clipmind.ai"))

# Where public contact-form submissions are delivered, and the address shown on
# the Contact page. Falls back to the sender address when unset.
CONTACT_EMAIL = config("CONTACT_EMAIL", default=DEFAULT_FROM_EMAIL)

# ---------------------------------------------------------------------------
# AI Provider Keys
# ---------------------------------------------------------------------------
GROQ_API_KEY = config("GROQ_API_KEY", default="")
GEMINI_API_KEY = config("GEMINI_API_KEY", default="")

# Frontend base URL — used in password-reset emails
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")

# ---------------------------------------------------------------------------
# drf-spectacular (Swagger / OpenAPI)
# ---------------------------------------------------------------------------
SPECTACULAR_SETTINGS = {
    "TITLE": "ClipMind AI API",
    "DESCRIPTION": "Production-ready AI SaaS backend for ClipMind AI.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOGS_DIR = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Production security
#
# These are hard-disabled while DEBUG is on so local HTTP development keeps
# working, and switch on automatically once DEBUG=False in a deployed
# environment. SECURE_PROXY_SSL_HEADER is required when TLS terminates at a
# load balancer (ALB / Azure App Gateway / nginx), otherwise Django believes
# every request is plain HTTP and redirect-loops.
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=not DEBUG, cast=bool)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # the SPA must read the CSRF cookie

SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000",
    cast=Csv(),
)

# Upload limits — keep large videos streaming to a temp file rather than RAM.
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024      # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024      # 10 MB

# ---------------------------------------------------------------------------
# Test-run overrides
#
# PBKDF2 deliberately costs ~0.5s per hash, which dominates a suite that
# creates users in every setUp. MD5 hashing is safe here because it applies
# ONLY to the throwaway test database, never to a real deployment. Tasks run
# eagerly and the cache is local so tests need neither Redis nor a worker.
# ---------------------------------------------------------------------------
if TESTING:
    PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = False
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "clipmind-test",
        }
    }
    # Keep media written by tests out of the real MEDIA_ROOT.
    MEDIA_ROOT = BASE_DIR / "test_media"
    # Throttling would make repeated API-test requests fail with 429.
    REST_FRAMEWORK = {
        **REST_FRAMEWORK,
        "DEFAULT_THROTTLE_RATES": {"anon": None, "user": None, "contact": None},
    }
    SECURE_SSL_REDIRECT = False

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "api_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "api.log",
            "maxBytes": 10 * 1024 * 1024,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
        },
        "ai_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "ai.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
        "celery_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "celery.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "errors.log",
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "formatter": "verbose",
        },
    },
    "loggers": {
        "api": {"handlers": ["console", "api_file"], "level": "INFO", "propagate": False},
        "ai": {"handlers": ["console", "ai_file"], "level": "INFO", "propagate": False},
        "celery": {"handlers": ["console", "celery_file"], "level": "INFO", "propagate": False},
        "django": {"handlers": ["console", "error_file"], "level": "WARNING", "propagate": False},
        "utils": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
