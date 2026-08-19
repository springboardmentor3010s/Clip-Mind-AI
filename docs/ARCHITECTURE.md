# ClipMind AI — Architecture

How the pieces fit together: the tech stack, the request/data flow, the role
model, and the reasoning behind the bigger design decisions. For the backend
API/data-model in detail see [`BACKEND.md`](./BACKEND.md); for the frontend
see [`FRONTEND.md`](./FRONTEND.md).

## What ClipMind AI is

An AI video summarization platform. A user uploads a video; the backend
transcribes it (speech-to-text), summarizes it, extracts key moments and
keywords, and makes all of that searchable, bookmarkable, and (for
Educators) turns it into study material for a classroom of Learners.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + React, TypeScript/JSX | File-based routing for the marketing site + dashboard split, React Server/Client component model |
| Styling | Tailwind CSS v4, hand-rolled Material 3 Expressive token system | Design tokens (`bg-md-*`, `text-md-*`) generated from a single brand seed color, full light/dark theming |
| Auth | Firebase Authentication (email/password + Google) on the client, verified server-side | Offloads credential storage/reset entirely to Firebase; backend never sees a password |
| Backend | FastAPI (Python) | Async-friendly, automatic OpenAPI/Swagger docs, first-class Pydantic validation |
| Database | PostgreSQL via SQLAlchemy ORM | Relational — users/roles/videos/classrooms/bookmarks are all naturally relational |
| Cache | Redis (optional) | Response caching for transcript/summary/analytics reads; the app runs fine without it — it's a resilient no-op wrapper, never a hard dependency |
| Object storage | Cloudflare R2 (S3-compatible) via `boto3` | Video file storage, multipart upload |
| Speech-to-text | OpenAI Whisper (`openai/whisper-tiny`, via `transformers`) | Runs locally, no external API call/cost per transcription |
| Summarization | HuggingFace DistilBART (`transformers`) | Local abstractive summarization, same reasoning as Whisper |
| Key moments / keywords | Extractive NLP — frequency-ranked keywords (`rake-nltk`) + chronological transcript segmentation | No LLM call needed; deterministic and fast |
| Auth tokens | `python-jose` (JWT) | Backend issues its own short-lived session JWT after verifying a Firebase ID token, so all existing `require_role()` guards keep working unchanged |
| Containerization | Docker + Docker Compose | One command brings up Postgres, Redis, backend, and frontend together |

## How the pieces are put together

```
Browser (Next.js)
   │
   │  Firebase Auth SDK (email/password, Google popup)
   ▼
Firebase Authentication  ──issues──▶  Firebase ID token
   │
   │  ID token sent to backend
   ▼
FastAPI  /auth/firebase-login
   │  verifies the ID token against Google's public certs
   │  (google-auth library — no service-account secret needed)
   │
   │  looks up / creates a local User row (role lives here, not in Firebase)
   ▼
Backend issues its own JWT  ──▶  stored in the browser, sent as Bearer token
   │
   ▼
Every other endpoint: require_role() dependency checks the JWT's role claim
```

The split matters: **Firebase owns the credential** (password hashing, reset
emails, Google OAuth handshake), but **Postgres owns the role** (Learner /
Educator / Administrator) and every piece of RBAC built on top of it. The
backend never stores or sees a real password for a Firebase-authenticated
account — see `backend/app/services/auth_service.py::firebase_login` and
`backend/app/core/firebase.py`.

### Request flow for a video

1. **Upload** — frontend requests a presigned multipart upload URL from
   `/upload/multipart/init`, uploads the file parts directly to Cloudflare
   R2, then confirms via `/upload/multipart/complete`. The video row is
   created in Postgres with a `PROCESSING` status.
2. **Background processing** — a background task pulls the file from R2,
   extracts audio (FFmpeg), runs Whisper for a timestamped transcript, then
   DistilBART for a summary, then the keyword/key-moment extractor. Each
   result is persisted as it completes; status flips to `COMPLETED`.
3. **Viewing** — the video detail page polls/reads the transcript, summary,
   and key moments, each cacheable in Redis and invalidated on edit or
   regenerate.
4. **Engagement** — bookmarks (video-level, summary-level, or a specific key
   moment), Study Mode (flashcards/fill-in-blank/MCQ generated from the
   transcript, editable and persisted by Educators), and analytics events
   all key off the video and the authenticated user.

## Role-based access control

Three roles, enforced server-side on every endpoint via a
`require_role()` FastAPI dependency factory — the frontend's role-aware
sidebar is a UX convenience, not the security boundary.

- **Learner** — views videos, bookmarks (whole video / summary / a specific
  highlight), Study Mode, joins classrooms an Educator added them to.
- **Educator** — everything a Learner can do, plus creating/editing Study
  Mode content, creating Classrooms, adding Learners to them by email,
  assigning videos to a classroom, and viewing classroom-scoped analytics
  (filtered to only that classroom's enrolled students).
- **Administrator** — a single-purpose Admin Panel: user/role management,
  platform-wide analytics, AI processing job status, storage management, and
  enforced platform settings (maintenance mode, registration toggle, max
  upload size). Administrator is never self-assignable at signup — only an
  existing admin can promote a user via `PATCH /users/{id}/role`, or it's
  bootstrapped directly in the database for the very first admin account.

## Classrooms

A cohort model so an Educator's videos and analytics don't get mixed across
their entire catalog: `Classroom` → `ClassroomMembership` (Learners, added by
email) → `ClassroomVideo` (assigned videos). Classroom analytics
(`GET /classrooms/{id}/analytics`) filter every views/bookmarks/Study-Mode
metric down to just that classroom's enrolled `student_ids`.

## Persistence model highlights

- No Alembic migrations — schema changes ship via `Base.metadata.create_all`
  plus a self-healing `ensure_column()` helper that adds missing columns to
  existing tables on startup. Fine for this project's size; would not scale
  to a team needing rollback-able migrations.
- A custom `GUID` SQLAlchemy `TypeDecorator` gives native `UUID` on Postgres
  but portable `CHAR(32)` on SQLite, so the test suite runs hermetically
  against in-memory SQLite with no real Postgres required.
- `PlatformSettings` is a singleton row (`id = 1`, get-or-create) — simple
  and sufficient for one global settings object.

## Deployment topology

`docker-compose.yml` runs four services on one Docker network:

| Service | Image | Notes |
|---|---|---|
| `db` | `postgres:15-alpine` | Named volume `postgres_data` — survives `docker compose down` (not `-v`) |
| `redis` | `redis:7-alpine` | Optional cache; safe to lose |
| `backend` | built from `backend/Dockerfile` | FastAPI + Uvicorn; loads Whisper/DistilBART weights on first boot (can take a few minutes) |
| `frontend` | built from `frontend/Dockerfile` | Next.js `output: "standalone"` production build |

See the root [`README.md`](../README.md) for exact run/deploy commands.

## Testing

- **Backend**: `pytest` against a hermetic in-memory SQLite DB (`backend/tests/conftest.py` sets env vars before any `app.*` import), with R2/Redis mocked or pointed at unreachable addresses so nothing external is required. Covers the upload → transcript → summary → key-moments pipeline, RBAC per role, classrooms, study materials, platform settings enforcement, and Firebase login (with `verify_firebase_id_token` monkeypatched — no real network call to Google needed).
- **Frontend**: Jest + React Testing Library for key interactive components (`SummaryViewer`, `KeywordTags`, video player key-moment markers).
- CI (`.github/workflows/`) runs both suites on every push/PR touching `backend/` or `frontend/`.
