# ClipMind AI

ClipMind AI is a full-stack video intelligence platform for uploading videos, generating transcripts and summaries, detecting key moments, and organizing content through a role-aware dashboard.

The project is implemented as a Next.js frontend and a FastAPI backend. It uses PostgreSQL for user and video metadata, MongoDB for transcript and summary documents, JWT-based authentication, and FFmpeg for video processing and playback support.

## What is implemented

| Milestone | Status | Highlights |
| --- | --- | --- |
| Milestone 1 | Completed | Next.js frontend and FastAPI backend wired end to end; JWT login, registration, and role-based access control; four personas; SQLAlchemy models that auto-create user and video tables; video upload flow with validation, file storage, and thumbnail processing; admin controls for listing users and updating roles; responsive glassmorphism UI across the landing page and dashboard |
| Milestone 2 | Completed | Whisper-based speech-to-text transcription flow; AI-powered summarization using Llama 3 style prompts and Groq-backed processing; transcript and summary storage in MongoDB; decoupled processing flow where users trigger AI insight generation manually; video streaming inside the dashboard; AI response fallback and retry handling for rate-limited services |

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | Next.js, React, Tailwind CSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Databases | PostgreSQL, MongoDB |
| Media | FFmpeg |
| Auth | JWT, bcrypt |

## Project Structure

- `frontend/` - Next.js app
- `frontend/src/app/` - App Router pages for landing, login, register, and dashboard views
- `frontend/src/components/` - Shared dashboard UI pieces
- `backend/` - FastAPI app, models, database helpers, and services
- `backend/api/` - Auth, video, admin, and insights endpoints
- `backend/db/` - PostgreSQL and MongoDB connection helpers
- `backend/services/` - Authentication and video processing logic
- `backend/uploads/` - Stored uploaded video files
- `docker-compose.yml` - Local PostgreSQL and MongoDB stack plus backend service
- `requirements.txt` - Root Python dependency list for the backend

## Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/` using `backend/.env.example` as the starting point.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Local databases

```bash
docker compose up -d postgres mongodb
```

### 4. Run the backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

The app expects working API keys and service credentials for the AI features to behave as described in the milestone decks.

- `SECRET_KEY`
- `POSTGRES_URL`
- `MONGO_URL`
- `HF_TOKEN`
- Groq / OpenAI-compatible API keys used by the AI processing workflow

The repository already includes a starter file at [backend/.env.example](backend/.env.example) with the local variable names and example values.

## API Surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/video/upload`
- `GET /api/video/`
- `GET /api/video/{video_id}`
- `GET /api/video/stream/{video_id}`
- `POST /api/video/{video_id}/process`
- `DELETE /api/video/{video_id}`
- `GET /api/admin/users`
- `PUT /api/admin/users/{user_id}/role`
- `GET /api/insights/transcript/{video_id}`
- `GET /api/insights/summary/{video_id}`

Devanshi Malhotra, 2026

