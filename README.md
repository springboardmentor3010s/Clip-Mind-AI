<div align="center">

# 🎬 ClipMind AI

**AI-powered video summarization & key-moments detection platform**

Turn long-form video into transcripts, concise summaries, and timestamped highlights — automatically.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TanStack-blue)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)]()
[![Status](https://img.shields.io/badge/Status-MVP%20%2F%20Local-orange)]()

</div>

---

## 📖 Overview

ClipMind AI is a video intelligence platform built to help content creators, students, educators, and teams consume long-form video content more efficiently. Upload a video and the platform automatically:

1. Transcribes speech to text
2. Generates a concise, AI-written summary
3. Detects key moments and important segments with timestamps
4. Surfaces content insights through an analytics dashboard

## ✨ Features

| Area | Capability |
|---|---|
| 📤 **Video Management** | Upload, list, view, and delete videos |
| 📝 **Transcription** | Speech-to-text via `faster-whisper`, stored and retrievable per video |
| 🧠 **AI Summarization** | Extractive summarization (TextRank) with keyword extraction |
| ⏱️ **Key Moments Detection** | Timestamped highlights scored by salience, keyword density, and position |
| 📊 **Analytics Dashboard** | Speaker share, keyword trends, sentiment timeline, aggregate usage stats |
| 🔐 **Auth Flows** | Login, register, forgot-password UI (currently mocked client-side) |

## 🛠️ Tech Stack

**Frontend**
- React 19 + TanStack Start / TanStack Router (file-based routing)
- Vite + TypeScript
- Tailwind CSS v4 + shadcn/ui (built on Radix primitives)
- TanStack Query · React Hook Form + Zod · Axios · Recharts · Framer Motion

**Backend**
- FastAPI (Python) + SQLAlchemy + SQLite
- `faster-whisper` for transcription
- FFmpeg for audio extraction & duration probing
- scikit-learn + NetworkX for TextRank summarization
- PyJWT for token-based auth (not yet wired to frontend)

> **Current state:** this is a local-first MVP — no Docker or cloud deployment yet. Everything runs on your machine with SQLite on disk. Docker/AWS/Azure deployment is on the roadmap (see below), not yet implemented.

## 📁 Project Structure

```
clipmind-ai-project/
├── src/                        # Frontend — TanStack Start app
│   ├── routes/                 # File-based routes (login, register, dashboard, ...)
│   ├── components/             # UI components (shadcn/ui based)
│   ├── services/                # API clients: video, transcript, summary, moments, analytics, auth
│   ├── context/                 # Auth, Theme, Workspace, Toast providers
│   └── utils/mockEngine.ts     # Local mock data engine (used before backend is wired up)
│
└── clipmind-backend/           # Backend — FastAPI service
    ├── main.py                 # App entrypoint, CORS, route registration
    ├── config.py               # Env-driven settings
    ├── models/                 # SQLAlchemy models + Pydantic schemas
    ├── services/                # ffmpeg, whisper, nlp, moments, analytics, pipeline
    ├── routes/                  # videos, transcript, summary, moments, analytics, history
    └── data/                    # Runtime uploads/, audio/, clipmind.db (auto-created)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm (or Bun — `bunfig.toml` is present)
- Python 3.10+
- FFmpeg on your PATH — confirm with:
  ```bash
  ffmpeg -version && ffprobe -version
  ```

### 1. Backend setup

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
- On first call to `/api/generate-transcript`, the whisper `base` model (~150MB) downloads once, then runs fully offline.

### 2. Frontend setup

```bash
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

App runs at `http://localhost:5173/`.

### 3. Run the full pipeline

```bash
# 1. Upload a video
curl -F "file=@/path/to/video.mp4" http://localhost:8000/api/upload
# -> { "id": "...", "status": "Queued", ... }

# 2. Run transcript -> summary -> key moments -> analytics in one call
curl -X POST http://localhost:8000/api/process/<video_id>

# 3. Fetch the library
curl "http://localhost:8000/api/history?sort=newest"
```

## 📡 API Reference

| Frontend service | Backend route |
|---|---|
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

## 🧑‍🤝‍🧑 User Roles

| Role | Purpose |
|---|---|
| **Content Creator** | Upload videos, generate transcripts/summaries, manage content |
| **Learner** | Consume summaries, browse key moments, save learning history |
| **Educator** | Turn lecture videos into shareable, concise learning material |
| **Administrator** | Manage users, monitor platform activity, oversee AI processing jobs |

## 🗺️ Roadmap

- [ ] Wire up real authentication (JWT already scaffolded in the backend)
- [ ] Dockerize backend + frontend
- [ ] Cloud deployment (AWS / Azure)
- [ ] Swap SQLite → PostgreSQL / MongoDB for production
- [ ] Expand analytics (content insights, usage reports)

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

## 📝 Notes

- Auth is currently fully mocked on the frontend via `localStorage` (`AuthContext.tsx`); the backend has no auth routes wired up yet.
- Routing follows TanStack Start's file-based convention — see [`src/routes/README.md`](./src/routes/README.md) before adding new routes (no Next.js-style `pages/` or `app/` directories).

## 📄 License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.