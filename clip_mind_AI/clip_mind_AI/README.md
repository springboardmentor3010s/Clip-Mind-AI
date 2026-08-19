# ClipMind AI

**AI-powered video summarization & key moments detection platform.**

ClipMind AI ingests a video file or a YouTube link, transcribes it with Whisper,
generates a multi-section AI summary, detects key moments with timestamps and
thumbnails, and exposes it all through role-based dashboards and analytics.

This workspace contains two projects:

| Path | Description |
| --- | --- |
| `clip_mind_AI/` | React 19 + Vite frontend |
| `clip_mind_AI_Backend/` | Django 5 + DRF backend, Celery worker, AI pipeline |

---

## Table of contents

1. [Quick start with Docker](#1-quick-start-with-docker)
2. [Architecture](#2-architecture)
3. [User roles](#3-user-roles)
4. [AI pipeline](#4-ai-pipeline)
5. [Database schema](#5-database-schema)
6. [API reference](#6-api-reference)
7. [Frontend routes](#7-frontend-routes)
8. [Environment variables](#8-environment-variables)
9. [Local development without Docker](#9-local-development-without-docker)
10. [Testing](#10-testing)
11. [Security](#11-security)
12. [Deployment](#12-deployment)

---

## 1. Quick start with Docker

The entire stack — Postgres, Redis, Django, Celery and the React frontend —
runs from a single compose file.

```bash
cd clip_mind_AI_Backend
cp .env.docker.example .env.docker      # then edit: set SECRET_KEY and GROQ_API_KEY
docker compose --env-file .env.docker up -d --build
```

Then open:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| Django admin | http://localhost:8000/admin/ |
| Health probe | http://localhost:8000/health/ |

Migrations run automatically on boot, and an administrator account is created
from `DJANGO_SUPERUSER_EMAIL` / `DJANGO_SUPERUSER_PASSWORD` if it does not
already exist.

**At least one AI key is required** (`GROQ_API_KEY` or `GEMINI_API_KEY`) for the
transcription/summarization pipeline to run. Everything else works without one.

Useful commands:

```bash
docker compose --env-file .env.docker ps                  # service status
docker compose --env-file .env.docker logs -f worker      # follow the AI pipeline
docker compose --env-file .env.docker exec backend python manage.py test
docker compose --env-file .env.docker down                # stop
docker compose --env-file .env.docker down -v             # stop and wipe data
```

---

## 2. Architecture

```text
                    ┌──────────────────────────┐
   Browser ────────▶│  frontend (nginx :3000)  │  React 19 SPA, Vite build
                    └───────────┬──────────────┘
                                │ REST + JWT
                    ┌───────────▼──────────────┐
                    │  backend (gunicorn :8000)│  Django 5 + DRF
                    │  auth · RBAC · analytics │
                    └───┬──────────┬───────────┘
                        │          │ enqueue
              ┌─────────▼──┐   ┌───▼─────────────────┐
              │ PostgreSQL │   │ Redis               │
              │  (data)    │   │ broker + cache      │
              └─────────▲──┘   └───┬─────────────────┘
                        │          │ consume
                    ┌───┴──────────▼───────────┐
                    │  worker (Celery)         │
                    │  FFmpeg · Whisper · LLM  │
                    └──────────────────────────┘
```

**Design notes**

- The backend and worker share one image; only the command differs. The web
  container owns migrations so the two never race.
- Media lives on a named volume mounted into both backend and worker, so the
  worker can write thumbnails the API later serves.
- Video files are private and served through a signed-URL endpoint
  (`core/media.py`), because a `<video>` element cannot send an auth header.

---

## 3. User roles

Four roles, enforced in `core/permissions.py` (backend) and mirrored for
navigation in `src/lib/roles.js` (frontend). The backend is authoritative.

| Capability | Content Creator | Learner | Educator | Administrator |
| --- | :-: | :-: | :-: | :-: |
| Upload videos | ✅ | ❌ | ✅ | ✅ |
| Generate transcript / summary / key moments | ✅ | — | ✅ | ✅ |
| Download transcripts & summaries | ✅ | ✅ | ✅ | ✅ |
| Edit / review transcripts | ✅ | ❌ | ✅ | ✅ |
| Share content | ✅ | ❌ | ✅ | ✅ |
| Browse shared library | ✅ | ✅ | ✅ | ✅ |
| Bookmarks & learning history | ✅ | ✅ | ✅ | ✅ |
| Cross-video search | ✅ | ✅ | ✅ | ✅ |
| Content analytics | ✅ | ❌ | ✅ | ✅ |
| Learning materials | ❌ | ❌ | ✅ | ✅ |
| Classroom analytics & student engagement | ❌ | ❌ | ✅ | ✅ |
| Admin module (users, jobs, storage, audit) | ❌ | ❌ | ❌ | ✅ |

Users pick a role at registration. **`admin` cannot be self-assigned** — it is
granted by an existing administrator or via `createsuperuser`.

---

## 4. AI pipeline

Implemented in `apps/processing/tasks.py`, executed by Celery.

| # | Stage | Implementation | Output |
| --- | --- | --- | --- |
| 1 | Ingest | `download_youtube_video` (yt-dlp) or the uploaded file | local source |
| 2 | Validate | `utils/validators.py` — extension, size, magic bytes | accept/reject |
| 3 | Compress | FFmpeg H.264 CRF 28, ≤720p, `+faststart` | web-playable MP4 |
| 4 | Extract audio | FFmpeg → 16 kHz mono MP3 | audio track |
| 5 | Transcribe | Groq `whisper-large-v3` | `Transcript` + segments + language |
| 6 | Analyze | Groq `openai/gpt-oss-120b` (Gemini fallback) | 9-section JSON |
| 7 | Key moments | from the same analysis call | `KeyMoment` rows |
| 8 | Thumbnails | FFmpeg frame grab per moment | JPEG per moment |

The analysis call returns `short_summary`, `detailed_summary`, `bullet_summary`,
`chapter_summary` (topic segmentation), `important_topics` (keyword
extraction), `action_items`, `glossary`, `key_questions` and `key_moments`.

`services/ai/provider_manager.py` wraps Groq with an automatic Gemini fallback
on every operation, so a provider outage degrades rather than fails.

Progress is written to the `Video` row (`status`, `progress`, `current_step`)
and polled by the frontend via `GET /videos/<id>/progress`.

---

## 5. Database schema

| Model | App | Purpose |
| --- | --- | --- |
| `User` | accounts | Custom user; email login, 4 roles |
| `ActivityLog` | accounts | User activity history / platform activity feed |
| `AuditLog` | accounts | Privileged administrative actions |
| `PlatformSetting` | accounts | Admin-editable configuration |
| `Video` | videos | Source, lifecycle, progress, duration |
| `VideoTranslation` | videos | Cached translations of AI output |
| `VideoShare` | videos | Public token + optional named recipients |
| `VideoView` | videos | Individual view events (engagement signal) |
| `Bookmark` | videos | Saved video or timestamped highlight |
| `LearningHistory` | videos | Per-user watch state and completion |
| `Transcript` | transcripts | Text, timed segments, edit provenance |
| `Summary` | summaries | Structured AI analysis (JSON) |
| `KeyMoment` | summaries | Timestamp, title, description, thumbnail |
| `LearningMaterial` | summaries | Study notes / quiz / flashcards / lesson plan |

---

## 6. API reference

All endpoints are under `/api/v1/`. Interactive docs: `/api/docs/`.

### Authentication
| Method | Path | Role |
| --- | --- | --- |
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | public |
| POST | `/auth/logout` | authenticated |
| POST | `/auth/forgot-password` · `/auth/reset-password` | public |
| POST | `/auth/change-password` | authenticated |
| GET/PATCH | `/auth/profile` | authenticated |
| GET | `/auth/activity` | authenticated |

### Videos
| Method | Path | Role |
| --- | --- | --- |
| GET | `/videos/` | authenticated (visibility-scoped) |
| POST | `/videos/upload` · `/videos/youtube` | uploader roles |
| GET | `/videos/library` | authenticated |
| GET | `/videos/search?q=` | authenticated |
| GET/DELETE | `/videos/<id>` | owner / admin (read: shared too) |
| GET | `/videos/<id>/progress` | viewer |
| POST | `/videos/<id>/translate` | viewer |
| PATCH | `/videos/<id>/transcript` | creator / educator / admin |
| GET/POST/DELETE | `/videos/<id>/share` | owner |
| POST | `/videos/<id>/view` | viewer |
| GET | `/videos/shared/<token>` | **public** |

### Engagement
| Method | Path |
| --- | --- |
| GET/POST | `/videos/bookmarks` |
| DELETE | `/videos/bookmarks/<id>` |
| GET/DELETE | `/videos/history` |
| GET/POST | `/videos/materials` |
| GET/PATCH/DELETE | `/videos/materials/<id>` |

### Analytics
| Method | Path | Role |
| --- | --- | --- |
| GET | `/analytics/` | authenticated |
| GET | `/analytics/content` | creator / educator / admin |
| GET | `/analytics/classroom` | educator / admin |

### Administration (all require `admin`)
`/admin/stats` · `/admin/users` · `/admin/users/<id>` · `/admin/activity` ·
`/admin/content` · `/admin/jobs` · `/admin/storage` · `/admin/audit-logs` ·
`/admin/settings`

---

## 7. Frontend routes

| Route | Access |
| --- | --- |
| `/`, `/login`, `/register`, `/forgot-password`, `/reset-password` | public |
| `/shared/:token` | **public** share page |
| `/dashboard` | all roles (role-aware content) |
| `/upload`, `/processing` | uploader roles |
| `/library` | all (Learner's primary surface) |
| `/transcript`, `/summary`, `/key-moments` | all |
| `/search`, `/bookmarks`, `/history`, `/analytics` | all |
| `/learning-materials`, `/classroom` | educator / admin |
| `/admin` | admin |

---

## 8. Environment variables

### Backend (`.env` or compose environment)

| Variable | Purpose | Default |
| --- | --- | --- |
| `SECRET_KEY` | Django signing key | insecure dev value |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated hostnames | `127.0.0.1,localhost` |
| `SECURE_SSL_REDIRECT` | Force HTTPS | `not DEBUG` |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | PostgreSQL | — |
| `REDIS_URL` | Celery broker (DB 0) | `redis://localhost:6379/0` |
| `REDIS_CACHE_URL` | Django cache (DB 1) | `redis://localhost:6379/1` |
| `CORS_ALLOWED_ORIGINS` | Allowed SPA origins | localhost:3000,5173 |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins | localhost:3000,5173 |
| `FRONTEND_URL` | Used in reset emails & share links | `http://localhost:5173` |
| `GROQ_API_KEY` | Whisper + LLM (primary) | — |
| `GEMINI_API_KEY` | Fallback provider | — |
| `JWT_SECRET` | JWT signing (falls back to `SECRET_KEY`) | — |
| `EMAIL_*` | SMTP for password reset | — |
| `RUN_MIGRATIONS` | Container migrates on boot | `false` |
| `DJANGO_SUPERUSER_EMAIL` / `_PASSWORD` | Seed admin | — |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL. **Inlined at build time** — rebuild after changing. |

---

## 9. Local development without Docker

Requires Python 3.12, Node 20, PostgreSQL 16, Redis (or Memurai on Windows),
and FFmpeg on `PATH`.

```bash
# Backend
cd clip_mind_AI_Backend
python -m venv .venv && .venv/Scripts/activate     # Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                                # fill in DB + AI keys
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Celery worker (separate terminal)
celery -A config worker --loglevel=info             # Windows: add --pool=solo

# Frontend (separate terminal)
cd clip_mind_AI
npm install
cp .env.example .env
npm run dev
```

---

## 10. Testing

```bash
# Backend — 112 automated tests
python manage.py test                                   # local
docker compose --env-file .env.docker exec backend python manage.py test

# Frontend lint
cd clip_mind_AI && npm run lint
```

Coverage spans authentication, registration policy, RBAC for all four roles,
upload validation, tenant isolation, sharing and share revocation, bookmarks,
learning history, transcript editing, cross-video search, learning materials,
analytics (personal, content, classroom), the admin module, signed media
tokens, the Celery pipeline (with the AI layer mocked), and **AI output quality
gates** — summary compression ratio, key-moment timestamps within the video,
required sections populated, and monotonic transcript segments.

Tests use a fast password hasher, an in-memory cache and eager Celery, so the
suite needs neither Redis nor a worker and finishes in seconds.

`TESTING.md` documents the manual QA walkthrough.

---

## 11. Security

- **JWT** with rotation and blacklist-after-rotation; silent refresh in the SPA.
- **Password policy** enforced at registration and change: ≥8 chars, upper,
  lower, digit, special.
- **Role escalation blocked** — `admin` is rejected at the public register
  endpoint; admins cannot demote or deactivate themselves.
- **Tenant isolation** — every video query is scoped by ownership or an explicit
  share; unauthorised access returns `404`, never `403`, so IDs are not
  enumerable.
- **Private media** — video files require a signed, path-bound, 12-hour token,
  or an authenticated owner/admin/share-recipient. Path traversal is blocked.
- **Upload validation** — extension, 2 GB size cap, and container magic bytes,
  so a renamed executable is rejected.
- **Audit trail** — privileged actions are recorded with actor, target and IP.
- **Production hardening** — HSTS, secure cookies, `nosniff`, `X-Frame-Options:
  DENY`, referrer policy and `SECURE_PROXY_SSL_HEADER` all activate when
  `DEBUG=False`.
- **Secrets** never live in the image: `.env` is gitignored and dockerignored.

Known trade-off: JWTs are stored in `localStorage`, which is XSS-readable.
Moving to httpOnly cookies would require a CSRF strategy for the SPA.

---

## 12. Deployment

See the deployment guide for AWS and Azure steps. In summary, the stack is
container-ready: both images build from source, configuration is entirely
environment-driven, `/health/` reports database and cache reachability for load
balancer probes, and static files are served by WhiteNoise so no separate web
server is required.

For production, move media to object storage (S3 / Azure Blob) rather than the
container volume — video files are the dominant cost and the only stateful
component besides Postgres.
