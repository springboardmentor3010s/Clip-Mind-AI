<div align="center">

# 🎬 ClipMind AI

**AI-powered video summarization & key-moments detection platform**

Turn long-form video into transcripts, concise summaries, and timestamped highlights — automatically.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TanStack-blue)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)]()
[![Status](https://img.shields.io/badge/Status-MVP-orange)]()

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the Pipeline](#running-the-pipeline)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Roadmap](#roadmap)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

ClipMind AI is a video-intelligence platform that helps content creators, learners, and educators consume long-form video content more efficiently. Upload a video and the platform automatically:

1. Transcribes speech to text
2. Generates a concise, AI-written summary
3. Detects key moments and important segments with timestamps
4. Surfaces content insights through an analytics dashboard

## Features

| Area | Capability |
|---|---|
| 📤 **Video Management** | Upload, list, view, and delete videos |
| 📝 **Transcription** | Speech-to-text via `faster-whisper`, stored and retrievable per video |
| 🧠 **AI Summarization** | Extractive summarization (TextRank) with keyword extraction |
| ⏱️ **Key Moments Detection** | Timestamped highlights scored by salience, keyword density, and position |
| 📊 **Analytics Dashboard** | Speaker share, keyword trends, sentiment timeline, aggregate usage stats |
| 🔐 **Authentication** | JWT-based register/login/forgot-password, role assigned at signup |
| 🕘 **Upload History** | Searchable, filterable library of past uploads and their outputs |

## Tech Stack

**Frontend**
- React 19 + TanStack Start / TanStack Router (file-based routing)
- Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui (built on Radix primitives)
- TanStack Query · React Hook Form + Zod · Axios · Recharts · Framer Motion

**Backend**
- FastAPI (Python) + SQLAlchemy + SQLite
- `faster-whisper` for transcription
- FFmpeg for audio extraction and duration probing
- scikit-learn + NetworkX for TextRank-based summarization and keyword extraction
- PyJWT + PBKDF2 password hashing for authentication

**Deployment**
- Backend containerized with Docker, deployed on Render
- Frontend deployed as a static/web service on Render

> **Current state:** this is an MVP. It runs great locally on SQLite and deploys as-is via Docker/Render; swapping in PostgreSQL and a managed object store for uploads is the natural next step for scale (see [Roadmap](#roadmap)).

## Project Structure

```
ClipMind-AI/
├── src/                          # Frontend — TanStack Start app
│   ├── routes/                   # File-based routes (login, register, dashboard, ...)
│   │   └── _authenticated/       # Protected routes: upload, transcript, summary, moments, analytics, admin
│   ├── components/               # UI components (shadcn/ui based)
│   ├── services/                 # API clients: auth, video, transcript, summary, moments, analytics, history
│   ├── context/                  # Auth, Theme, Workspace, Toast providers
│   └── layouts/, hooks/, lib/, utils/
│
└── clipmind-backend/             # Backend — FastAPI service
    ├── main.py                   # App entrypoint, CORS, route registration
    ├── config.py                 # Env-driven settings
    ├── models/                   # SQLAlchemy models + Pydantic schemas
    ├── services/                 # ffmpeg, whisper, nlp, moments, analytics, activity, pipeline
    ├── routes/                   # auth, videos, transcript, summary, moments, analytics, history, activity, search
    ├── Dockerfile
    └── data/                     # Runtime uploads/, audio/, clipmind.db (auto-created)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm (Bun also supported — `bunfig.toml` is present)
- Python 3.10+
- FFmpeg on your `PATH` — confirm with:
  ```bash
  ffmpeg -version && ffprobe -version
  ```

### 1. Clone the repository

```bash
git clone https://github.com/dipanshiverma/ClipMind-AI.git
cd ClipMind-AI
```

### 2. Backend setup

```bash
cd clipmind-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional — sensible local defaults are already baked in
uvicorn main:app --reload --port 8000
```

- API root: `http://localhost:8000/`
- Swagger docs: `http://localhost:8000/docs`
- On first transcription request, the `faster-whisper` model downloads once (size depends on `WHISPER_MODEL_SIZE`), then runs fully offline.

### 3. Frontend setup

```bash
cd ..
npm install
```

Create a `.env.local` file in the project root:

```env
VITE_API_URL=http://localhost:8000/api
```

Then start the dev server:

```bash
npm run dev
```

The app runs at `http://localhost:5173/`.

> Never commit `.env` or `.env.local` files containing secrets to GitHub.

### 4. Docker (backend)

```bash
cd clipmind-backend
docker build -t clipmind-backend .
docker run -p 8000:8000 clipmind-backend
```

## Running the Pipeline

```bash
# 1. Upload a video
curl -F "file=@/path/to/video.mp4" http://localhost:8000/api/upload
# -> { "id": "...", "status": "Queued", ... }

# 2. Run transcript -> summary -> key moments -> analytics in one call
curl -X POST http://localhost:8000/api/process/<video_id>

# 3. Fetch the library
curl "http://localhost:8000/api/history?sort=newest"
```

## API Reference

| Frontend service | Backend route |
|---|---|
| `authService.login` | `POST /api/login` |
| `authService.register` | `POST /api/register` |
| `videoService.upload` | `POST /api/upload` |
| `videoService.list` | `GET /api/videos` |
| `videoService.get` | `GET /api/videos/{id}` |
| `videoService.remove` | `DELETE /api/videos/{id}` |
| `transcriptService.generate` | `POST /api/generate-transcript` |
| `transcriptService.get` | `GET /api/transcript/{id}` |
| `summaryService.generate` | `POST /api/generate-summary` |
| `summaryService.get` | `GET /api/summary/{id}` |
| `momentsService.generate` | `POST /api/generate-key-moments` |
| `momentsService.get` | `GET /api/key-moments/{id}` |
| `analyticsService.overview` | `GET /api/analytics?videoId=` |
| `historyService.list` | `GET /api/history?query=&status=&range=&sort=` |
| `historyService.remove` | `DELETE /api/history/{id}` |

Full details in [`clipmind-backend/README.md`](./clipmind-backend/README.md).

## User Roles

| Role | Purpose |
|---|---|
| **Content Creator** | Upload videos, generate transcripts/summaries, manage own content and history |
| **Learner** | Browse summaries and key moments, search transcripts, track learning history |
| **Educator** | Turn lecture videos into shareable, concise learning material for students |
| **Administrator** | Manage users, monitor platform activity, oversee AI processing jobs |

## Roadmap

- [ ] Expand role-based permissions beyond the current `role` field on `User`
- [ ] Swap SQLite → PostgreSQL for production-scale deployments
- [ ] Move uploaded media to object storage (S3-compatible) instead of local disk
- [ ] Multi-language transcription and real-time transcription
- [ ] Speaker identification and personalized summaries
- [ ] Mobile application

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.