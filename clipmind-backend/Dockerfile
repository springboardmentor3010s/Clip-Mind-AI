FROM python:3.11-slim

# Prevent Python from creating .pyc files
# and make Python output appear immediately
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
# FFmpeg is required by ClipMind AI for video/audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python dependencies first
COPY requirements.txt .

# Install CPU-only PyTorch first
RUN pip install --no-cache-dir torch==2.12.1 --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY app ./app

# Create directories required by ClipMind AI
RUN mkdir -p uploads \
    thumbnails \
    audio \
    transcripts \
    summaries

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]