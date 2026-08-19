# ClipMind AI

An AI-powered video summarization platform. Upload a video and ClipMind AI
transcribes it, summarizes it, extracts key moments and keywords, and turns
all of that into something Learners can study and Educators can curate and
manage across classrooms — with a real role-based access model
(Learner / Educator / Administrator) enforced end to end.

- **In-depth architecture** (data flow, RBAC, deployment topology): [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **Backend implementation & API reference**: [`docs/BACKEND.md`](./docs/BACKEND.md) (or the live, always-current Swagger UI at `http://localhost:8000/docs` once the backend is running)
- **Frontend implementation details**: [`docs/FRONTEND.md`](./docs/FRONTEND.md)

## Features

- Whisper-based speech-to-text transcription, HuggingFace DistilBART
  summarization (Quick + Detailed), extractive key-moment detection and
  keyword extraction — all running locally, no external AI API calls.
- Full-text search across every transcript.
- Granular bookmarking — a whole video, a specific summary, or a single
  highlight.
- Study Mode: auto-generated flashcards / fill-in-blank / MCQs, curatable
  and persisted by Educators.
- Classrooms: Educators group Learners and assign specific videos to a
  cohort, with classroom-scoped engagement analytics.
- Admin Panel: user & role management, platform-wide analytics, AI
  processing job visibility, storage management, and enforced platform
  settings (maintenance mode, registration toggle, upload size limit).
- Firebase Authentication — email/password and Google sign-in, with
  self-service password reset (see [Authentication](#authentication)).
- Shareable read-only links for a video's summary.

## Tech stack

| | |
|---|---|
| **Frontend** | Next.js (App Router) + React, Tailwind CSS v4, hand-built Material 3 Expressive design system, Framer Motion |
| **Auth** | Firebase Authentication (client), verified server-side via `google-auth` — no service-account secret needed |
| **Backend** | FastAPI (Python), SQLAlchemy ORM |
| **Database** | PostgreSQL |
| **Cache** | Redis (optional — the app runs identically without it) |
| **Object storage** | Cloudflare R2 (S3-compatible), multipart upload |
| **AI/NLP** | OpenAI Whisper, HuggingFace DistilBART, `rake-nltk` keyword extraction — all local, via `transformers` |
| **Containerization** | Docker + Docker Compose |

Full reasoning behind each choice, and how the pieces connect, is in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Authentication

Firebase owns the credential (password storage, reset emails, Google OAuth);
the backend only ever sees a verified Firebase ID token, exchanges it for
its own short-lived session JWT, and is the source of truth for **role**
(Learner/Educator/Administrator lives in Postgres, not Firebase). Forgot
password is handled entirely by Firebase's built-in reset-email flow — no
backend involvement.

The Firebase web config in `frontend/src/lib/firebase.ts` has working
defaults baked in (Firebase web config values aren't secret — see
[`frontend/.env.example`](./frontend/.env.example) if you need to point at a
different Firebase project). The backend needs `FIREBASE_PROJECT_ID` to
match (see `backend/.env.example`) so it can verify tokens against the
right project.

**Administrator accounts can't self-register** (by design — see
`SELF_REGISTERABLE_ROLES` in `backend/app/services/auth_service.py`).
Bootstrap the first admin by registering normally, then promoting the row
directly:

```bash
psql "$DATABASE_URL" -c "
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Administrator')
WHERE email = 'your-admin-email@example.com';
"
```

## Running locally

### Option A — Docker (recommended, no local Python/Node setup)

1. Create a `.env` file in the repo root with your Cloudflare R2 credentials
   (see `backend/.env.example` for the full list).
2. ```bash
   docker compose up --build -d
   ```
3. Visit `http://localhost:3000` (frontend) and `http://localhost:8000/docs`
   (backend API docs).
4. `docker compose logs -f` to tail logs, `docker compose down` to stop
   (keeps the Postgres volume — data survives), `docker compose down -v` to
   also wipe it.

If port `5432` is already in use locally, remap just the `db` service in
`docker-compose.yml` (e.g. `"5433:5432"`) — that's host-only and doesn't
affect container-to-container networking or your data.

### Option B — Manual (Python + Node)

**Prerequisites:** PostgreSQL running locally, FFmpeg installed (`brew
install ffmpeg` / `sudo apt install ffmpeg` / see `backend/.env.example` for
Windows options).

```bash
# Database
psql -U postgres -c "CREATE DATABASE clipmind;"

# Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in R2 credentials
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Running the test suites

```bash
# Backend — hermetic, in-memory SQLite, no external services required
cd backend && venv/bin/pytest tests/ -v

# Frontend
cd frontend && npm test
```

CI (`.github/workflows/`) runs both automatically on every push/PR touching
`backend/` or `frontend/`.

## Deploying

The project ships as two Docker images (backend, frontend) plus Postgres
and Redis, orchestrated by `docker-compose.yml` — that's the deployment
unit for any Docker-capable host (a VM, a bare-metal box, etc):

1. Copy the repo (or just `docker-compose.yml` + the `backend`/`frontend`
   directories) to the target host.
2. Provide the same `.env` (R2 credentials, `SECRET_KEY`, `FIREBASE_PROJECT_ID`)
   at the repo root — **never commit this file**; `backend/.env` and root
   `.env` are both gitignored for exactly this reason.
3. ```bash
   docker compose up --build -d
   ```
4. Point a reverse proxy (nginx, Caddy, Traefik, etc.) at ports `3000`
   (frontend) and `8000` (backend) for TLS termination and a real domain —
   `docker-compose.yml` itself doesn't handle HTTPS.
5. The backend downloads/loads Whisper + DistilBART model weights on first
   boot, which can take several minutes — this is expected, not a hang.

**Updating an existing deployment without touching data:**

```bash
git pull origin <branch>
docker compose up --build -d
```

This rebuilds only the images whose source changed and recreates those
containers — the `db`/`redis` containers and their volumes are left alone
unless you explicitly run `docker compose down -v`. Never run the `-v`
variant on a deployment you want to keep the database for.

## Project structure

```
backend/    FastAPI app — see docs/ARCHITECTURE.md
frontend/   Next.js app — see docs/FRONTEND.md
docs/       Architecture and frontend deep-dive documentation
```
