# ClipMind AI

An AI-powered video learning platform that transforms educational videos into searchable transcripts, summaries, and key learning moments.

ClipMind AI helps students and educators consume and manage video-based learning content more efficiently. Videos are processed with **FFmpeg** for audio extraction and **OpenAI Whisper** for speech-to-text transcription, then enriched with AI-generated summaries and key-moment detection.

Built with a **React + FastAPI + PostgreSQL** stack and fully containerized with **Docker Compose**.

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [AI Processing Pipeline](#ai-processing-pipeline)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Accessing the Application](#accessing-the-application)
- [API Documentation](#api-documentation)
- [Useful Docker Commands](#useful-docker-commands)
- [Roadmap](#roadmap)
- [Contributors](#contributors)

---

## Features

- **Video Upload & Management** — Upload and manage educational videos through a role-based platform (Admin, Educator, Creator, Learner)
- **AI Transcription** — Automatic speech-to-text using OpenAI Whisper, with timestamped transcript segments (`.txt` / `.json`)
- **AI-Powered Summaries & Key Moments** — Automatic content summarization and key-moment detection via the Groq API
- **Classrooms & Courses** — Course creation, enrollment, classrooms, and learning material management
- **Analytics Dashboards** — Engagement, storage, and processing-job analytics for admins and educators
- **Authentication** — JWT-based auth with bcrypt password hashing
- **Dockerized Deployment** — One-command startup via Docker Compose

---

## System Architecture

```
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │     (Nginx)          │
                    └──────────┬───────────┘
                               │ HTTP
                               ▼
                    ┌──────────────────────┐
                    │   FastAPI Backend     │
                    │      Port 8000        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        ┌───────────┐   ┌─────────────┐   ┌─────────────┐
        │ PostgreSQL│   │   FFmpeg    │   │   Whisper   │
        │  Database │   │ Audio/Video │   │Transcription│
        └───────────┘   │ Processing  │   └─────────────┘
                         └─────────────┘
```

**Processing pipeline:** Upload → FFmpeg audio extraction → Whisper transcription → Transcript storage (TXT/JSON) → AI summarization & key-moment detection → Learning platform

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, JavaScript, CSS, Nginx (production) |
| **Backend** | Python, FastAPI, Uvicorn, SQLAlchemy, JWT, bcrypt |
| **Database** | PostgreSQL, MongoDB |
| **AI / Processing** | OpenAI Whisper, FFmpeg, FFprobe, Groq API |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## AI Processing Pipeline

1. **Upload** — User uploads a video via the React frontend; the request is handled by the FastAPI backend and the file is stored under `backend/uploads/videos/` (mounted as `/app/uploads` in Docker).
2. **Audio Extraction** — FFmpeg extracts the audio track and saves it to `uploads/audio/`.
3. **Transcription** — The audio is transcribed using the bundled **Whisper Tiny** model (`backend/models/tiny.pt`), avoiding a model download on container startup.
4. **Transcript Generation** — Output is saved as both `.txt` and timestamped `.json` under `uploads/transcripts/`, e.g.:

   ```json
   [
     {
       "start": 0.0,
       "end": 6.2,
       "text": "Introduction to the topic..."
     }
   ]
   ```

5. **AI Summarization & Key Moments** — The transcript is passed through the Groq API to generate summaries, topic breakdowns, and key learning moments, which are then persisted to PostgreSQL for use across the platform.

---

## Project Structure

```
ClipMind-AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/            # Admin routes
│   │   │   ├── auth/             # Auth routes
│   │   │   ├── classroom/        # Classroom routes
│   │   │   ├── creator/          # Creator routes
│   │   │   ├── educator/         # Educator routes
│   │   │   ├── enrollment/       # Enrollment routes
│   │   │   ├── learner/          # Learner routes
│   │   │   └── transcript/       # Transcript routes
│   │   ├── core/                 # Config, security, dependencies
│   │   ├── database/             # PostgreSQL & MongoDB connections
│   │   ├── middleware/           # Auth & CORS middleware
│   │   ├── models/                # SQLAlchemy models (user, video, course, etc.)
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # AI pipeline, Whisper, FFmpeg, summaries, analytics
│   │   └── main.py
│   ├── models/
│   │   └── tiny.pt                # Whisper Tiny model (bundled)
│   ├── tests/
│   ├── uploads/
│   │   ├── videos/
│   │   ├── audio/
│   │   ├── transcripts/
│   │   └── classroom_materials/
│   ├── docs/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/                   # Axios client
│   │   ├── components/            # Shared UI components
│   │   ├── context/                # Theme & video context providers
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── creator/
│   │   │   ├── educator/
│   │   │   ├── learner/
│   │   │   └── shared/            # Home, Login, Register
│   │   ├── routes/                 # AppRoutes.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

Verify your setup:

```bash
docker --version
docker compose version
docker info
```

### Installation

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ClipMind-AI
docker compose build
docker compose up -d
```

---

## Environment Variables

Create a `.env` file inside `backend/` (never commit this file):

```env
DATABASE_URL=postgresql://clipmind:clipmind@db:5432/clipmind
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GROQ_API_KEY=your_groq_api_key
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

> Keep `GROQ_API_KEY`, `JWT_SECRET_KEY`, and database credentials out of version control. `.env` is already excluded via `.gitignore`.

---

## Accessing the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

---

## API Documentation

Core auth endpoints:

```
POST /auth/register
POST /auth/login
```

Additional endpoints cover video management, transcription, classrooms, courses, and analytics for each role (Admin, Educator, Creator, Learner). Full interactive documentation is available at `/docs` once the app is running.

---

## Useful Docker Commands

```bash
docker compose up -d              # Start in background
docker compose down               # Stop containers
docker compose ps                 # View running containers
docker compose logs -f backend    # Follow backend logs
docker compose up -d --build      # Rebuild after code changes
```

---

## Future Improvements

- Email verification & password reset
- Advanced video search
- Cloud-based file storage
- Background task queue for large video processing
- Production HTTPS deployment with reverse proxy

---

## Contributors

**Sai Sathwik Aitha**
Computer Science and Engineering — AI & ML, VIT-AP University