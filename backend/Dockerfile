FROM python:3.12-slim

WORKDIR /app

# ffmpeg is required by app/services/transcription.py for audio extraction;
# libpq-dev + gcc are required to build psycopg2 from source on slim images.
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# torch/transformers are large downloads; a generous timeout + retries avoids
# spurious failures on slower connections.
RUN pip install --no-cache-dir --default-timeout=180 --retries=5 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
