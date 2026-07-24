# ClipMind AI

ClipMind AI is a full-stack video intelligence platform for uploading videos, generating transcripts and summaries, detecting key moments, and organizing content through a role-aware dashboard.

The project is implemented as a Next.js frontend and a FastAPI backend. It uses PostgreSQL for user and video metadata, MongoDB for transcript and summary documents, JWT-based authentication, and FFmpeg for video processing and playback support.

## What is implemented

### Milestone 1

- Next.js frontend and FastAPI backend wired end to end
- JWT login, registration, and role-based access control
- Four personas: content creator, learner, educator, and administrator
- SQLAlchemy models that auto-create the user and video tables on startup
- Video upload flow with validation, file storage, and thumbnail processing
- Admin controls for listing users and updating roles
- Responsive glassmorphism UI across the landing page and dashboard

### Milestone 2

- Whisper-based speech-to-text transcription flow
- AI-powered summarization using Llama 3 style prompts and Groq-backed processing
- Transcript and summary storage in MongoDB
- Decoupled processing flow where users trigger AI insight generation manually
- Video streaming inside the dashboard
- AI response fallback and retry handling for rate-limited services

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, Framer Motion
- Backend: FastAPI, SQLAlchemy, Uvicorn
- Databases: PostgreSQL, MongoDB
- Media: FFmpeg
- Auth: JWT, bcrypt

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

## Status

The repository currently reflects Milestone 1 and Milestone 2 functionality from the presentation decks. The AI workflow is intended to be fully functional when the required API keys and database services are configured.