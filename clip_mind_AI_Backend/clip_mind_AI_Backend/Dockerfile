# ClipMind AI — backend image (Django + DRF + Celery worker share this image).
FROM python:3.12-slim

# Python behaviour: no .pyc files, unbuffered logs so container output streams.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System packages:
#   ffmpeg  — audio extraction, compression and thumbnail frames
#   libpq5  — PostgreSQL client library required by psycopg2-binary
#   curl    — container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first so this layer is cached across code changes.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Normalise line endings — the repo is edited on Windows, and a CRLF shebang
# makes the kernel fail to find the interpreter ("no such file or directory").
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Writable runtime directories (media is also a mounted volume in compose).
RUN mkdir -p /app/media /app/logs /app/staticfiles

# Run as a non-root user — a container that processes untrusted uploaded media
# should not be root.
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

# Default command; docker-compose overrides this for the Celery worker.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
