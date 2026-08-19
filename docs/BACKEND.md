# ClipMind AI — Backend

Implementation notes for the FastAPI backend: structure, data model, every
API endpoint grouped by router, the auth/RBAC model, background processing,
and testing. For the frontend's side and the system-wide picture, see
[`FRONTEND.md`](./FRONTEND.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md).

The interactive, always-up-to-date API reference is the auto-generated
Swagger UI at `http://localhost:8000/docs` (or `/redoc`) once the server is
running — this document is the narrative version: what each area is for and
how the pieces connect, not a field-by-field schema dump.

## Stack

- **FastAPI** — async-friendly, automatic OpenAPI docs, Pydantic request/response validation.
- **SQLAlchemy ORM** over **PostgreSQL** (SQLite in tests — see [Testing](#testing)).
- **`python-jose`** for the backend's own session JWTs.
- **`google-auth`** to verify Firebase Authentication ID tokens server-side (no service-account secret needed — see [Authentication](#authentication--rbac)).
- **`passlib[bcrypt]`** for the (now mostly vestigial) local password hash column — see the auth section.
- **`boto3`** against Cloudflare R2 (S3-compatible) for video object storage.
- **`transformers`** running OpenAI Whisper (speech-to-text) and HuggingFace DistilBART (summarization) locally — no external AI API calls.
- **`rake-nltk`** for keyword extraction.
- **Redis** (`redis>=5.0.0`), optional — a resilient no-op cache wrapper when unavailable.
- **`pytest`** + **`httpx`**/FastAPI's `TestClient` for a fully hermetic test suite.

## Project structure

```
backend/app/
  main.py              FastAPI app instance, CORS, router registration, startup (create_all + ensure_column)
  core/
    config.py            Settings (env-driven, pydantic-settings)
    database.py           SQLAlchemy engine/session
    types.py                GUID type decorator (portable UUID: native on Postgres, CHAR(32) on SQLite)
    security.py            password hashing, JWT create/decode
    firebase.py             Firebase ID token verification (google-auth)
    dependencies.py         get_db, get_current_user, require_user, require_admin, require_role(), require_content_manager
    cache.py                 Redis wrapper — get/set/delete, no-ops if Redis is unreachable
    platform_settings_store.py  get-or-create for the PlatformSettings singleton row
  models/                 one SQLAlchemy model per file (see Data model below)
  schemas/                 Pydantic request/response models, one file per feature area
  services/                 business logic — auth, transcription, summarization, key-moment/keyword extraction, R2 storage
  api/                     one FastAPI router per feature area (see API reference below)
```

## Data model

| Table | Purpose |
|---|---|
| `roles` | `Creator`, `Learner`, `Educator`, `Administrator` — seeded at startup |
| `users` | `username`, `email`, `password_hash` (unusable random hash for Firebase-authenticated accounts — see [Authentication](#authentication--rbac)), `role_id` |
| `videos` | title, R2 object key, multipart upload tracking, `status` (`PENDING`/`PROCESSING`/`COMPLETED`/`FAILED`), duration, file size |
| `transcripts` | full text, timestamped `segments` (JSON), extracted `keywords` (JSON) |
| `summaries` | `short_summary`, `detailed_summary` |
| `key_moments` | per-video chronological chapters — start/end time, title, description |
| `study_materials` | one row per video (unique `video_id`), `flashcards`/`fill_in_blanks`/`mcqs` (JSON), persisted and Educator-editable — not regenerated on every read |
| `bookmarks` | `target_type` (`video` / `summary` / `key_moment`) + optional `target_id`, so a bookmark can point at more than just "the whole video" |
| `classrooms` | Educator-owned cohort (`educator_id`, `name`) |
| `classroom_memberships` | Learner ↔ classroom, added by email |
| `classroom_videos` | which videos are assigned to which classroom |
| `shared_links` | public read-only token → video, for the `/share/{token}` page |
| `analytics_events` | `event_type` (`video_view`, `export_txt`, `processing_time`, `study_mode_started`, ...) per video/user, the raw log every analytics rollup reads from |
| `audit_log` | admin-visible trail of sensitive actions (e.g. role changes) |
| `platform_settings` | singleton row (`id = 1`): `maintenance_mode`, `allow_new_registrations`, `max_upload_size_mb` |

No Alembic migrations — `Base.metadata.create_all()` plus a self-healing
`ensure_column()` helper (run at startup) adds any columns a model gained
since the table was first created. Deliberately simple; wouldn't scale to a
team needing rollback-able migrations, but there's no ops overhead for a
project this size.

A custom `GUID` `TypeDecorator` (`app/core/types.py`) stores UUID primary
keys as a native `UUID` column on Postgres and a portable `CHAR(32)` on
SQLite — this is what lets the test suite run against an in-memory SQLite
DB with zero behavior difference from production Postgres.

## Authentication & RBAC

**Firebase owns the credential; Postgres owns the role.** The frontend
authenticates directly against Firebase (email/password or Google) and
never sends a password to this backend. Instead:

1. Frontend calls `POST /auth/firebase-login` with the Firebase ID token
   (plus a `role` and `username` on first sign-up only).
2. `app/core/firebase.py::verify_firebase_id_token` verifies the token's
   signature against Google's public certs and checks its issuer/audience
   against `FIREBASE_PROJECT_ID` — via `google-auth`, so **no Firebase
   Admin SDK service-account secret is needed**.
3. `app/services/auth_service.py::firebase_login` finds the local `User` row
   by the token's email, or creates one (role required at creation — an
   unknown email with no role gets `{"needs_role": true}` back so the
   frontend can prompt for one). The row's `password_hash` is a random,
   unusable value — this account only ever authenticates via Firebase.
4. The backend issues its own short-lived JWT (`create_access_token`,
   `app/core/security.py`) exactly as it always has — every downstream
   `require_role()` check is unaffected by the switch to Firebase.

The legacy `POST /auth/register` / `POST /auth/login` (bcrypt password
against the local `password_hash`) still exist and still work — they're
just unused by the current frontend.

**RBAC** is a FastAPI dependency chain in `app/core/dependencies.py`:

- `get_current_user` — decodes the JWT, returns `None` if absent (optional auth).
- `require_user` — 401 if not authenticated.
- `require_role(*roles)` — a dependency *factory*; 403 unless the caller's
  role is in the given list. **Administrator always passes**, regardless of
  the list — admins can act across every content area.
- `require_admin` — its own dependency, equivalent in effect to `require_role("Administrator")`.
- `require_content_manager` — shorthand for `require_role("Creator", "Educator")`, i.e. "can create/manage content" (Learners are read-only).

Ownership checks layer on top where role alone isn't enough — e.g. a
classroom's `educator_id` must match the caller (or the caller must be an
Administrator) before they can manage its students/videos.

**Administrator is never self-assignable at signup.** `SELF_REGISTERABLE_ROLES`
in `auth_service.py` is `{Creator, Learner, Educator}` only. The first admin
is bootstrapped directly in the database:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Administrator')
WHERE email = 'admin@example.com';
```

After that, `PATCH /users/{id}/role` (Administrator-only) promotes anyone else.

## API reference by router

All routes are relative to the backend's base URL (e.g. `http://localhost:8000`).
🔒 = requires authentication. Role names in parentheses mean
`require_role(...)` — remember Administrator always passes those checks too.

### `/auth` — Authentication
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | Legacy local-password registration (unused by current frontend, still functional) |
| POST | `/auth/login` | Legacy local-password login |
| POST | `/auth/firebase-login` | Exchange a verified Firebase ID token for a backend session JWT; creates the local `User` row on first sign-in |

### `/upload` — Video upload & library
| Method | Path | Notes |
|---|---|---|
| POST | `/upload/multipart/init` 🔒 | Starts a multipart upload to R2; enforces `maintenance_mode` and `max_upload_size_mb` |
| POST | `/upload/multipart/presigned-urls` 🔒 | Presigned URLs for each part |
| POST | `/upload/multipart/complete` 🔒 | Finalizes the upload, creates the `Video` row, kicks off background AI processing |
| POST | `/upload/multipart/abort` 🔒 | Aborts an in-progress multipart upload |
| GET | `/upload/videos` 🔒 | List videos |
| GET | `/upload/video/{video_id}` 🔒 | Video detail |
| PATCH | `/upload/video/{video_id}` 🔒 | Rename |
| DELETE | `/upload/video/{video_id}` 🔒 | Cascade-deletes DB rows and the R2 object |

### `/transcript`
| Method | Path | Notes |
|---|---|---|
| GET | `/transcript/{video_id}` | Cached in Redis when available |
| PUT | `/transcript/{video_id}` 🔒 (content manager) | Manual segment edit |
| POST | `/transcript/{video_id}/regenerate` 🔒 (content manager) | Re-runs Whisper |
| GET | `/transcript/{video_id}/export` | `.txt` / `.srt` |

### `/summary`
| Method | Path | Notes |
|---|---|---|
| POST | `/summary/generate` 🔒 (content manager) | Runs DistilBART |
| GET | `/summary/{video_id}` | Cached |
| PUT | `/summary/{video_id}` 🔒 (content manager) | Manual edit |
| GET | `/summary/{video_id}/export` | Short or detailed, `.txt` |

### `/key-moments`
| Method | Path | Notes |
|---|---|---|
| POST | `/key-moments/generate` 🔒 (content manager) | Extractive keyword-density chaptering |
| GET | `/key-moments/{video_id}` | List |
| GET | `/key-moments/{video_id}/export` | Highlight report |

### `/learn` — Study Mode
| Method | Path | Notes |
|---|---|---|
| GET | `/learn/{video_id}/study-materials` | Returns the saved set if one exists (`is_saved: true`), otherwise generates on the fly without persisting |
| POST | `/learn/{video_id}/study-materials/generate` 🔒 (content manager) | Regenerates and **overwrites** the saved set |
| PUT | `/learn/{video_id}/study-materials` 🔒 (content manager) | Persists a manually edited set — this is what makes it "the version students see" |

### `/search`
| Method | Path | Notes |
|---|---|---|
| GET | `/search?q=...` | Full-text match across every transcript, grouped by video with timestamp context |

### `/bookmarks`
| Method | Path | Notes |
|---|---|---|
| POST | `/bookmarks` 🔒 | `target_type`: `video` / `summary` / `key_moment`, optional `target_id` for the latter two |
| GET | `/bookmarks` 🔒 | The caller's own bookmarks |
| DELETE | `/bookmarks/{bookmark_id}` 🔒 | |

### `/share`
| Method | Path | Notes |
|---|---|---|
| POST | `/share` 🔒 | Mint a public read-only token for a video |
| GET | `/share/mine` 🔒 | Links the caller created |
| DELETE | `/share/{link_id}` 🔒 | Revoke |
| GET | `/share/{token}` | Public, no auth — powers the `/share/[token]` page |

### `/classrooms`
| Method | Path | Notes |
|---|---|---|
| POST | `/classrooms` 🔒 (Educator) | Create a cohort |
| GET | `/classrooms/mine` 🔒 (Educator) | Cohorts the caller owns |
| GET | `/classrooms/joined` 🔒 | Cohorts a Learner has been added to |
| GET | `/classrooms/{id}` 🔒 | Owner or member only |
| DELETE | `/classrooms/{id}` 🔒 | Owner (or Administrator) only |
| POST/DELETE | `/classrooms/{id}/students[/{student_id}]` 🔒 | Add rejects non-Learner emails |
| POST/DELETE | `/classrooms/{id}/videos[/{video_id}]` 🔒 | Assign/unassign a video to the cohort |
| GET | `/classrooms/{id}/analytics` 🔒 | Views/unique-viewers/bookmarks/Study-Mode engagement, filtered to only this classroom's enrolled students |

### `/analytics`
| Method | Path | Notes |
|---|---|---|
| POST | `/analytics/event` | Records a `video_view` / `export_txt` / `study_mode_started` / etc event |
| GET | `/analytics/dashboard` | Platform-wide rollups — uploads/downloads/views timelines, keyword/key-moment totals |
| GET | `/analytics/insights` | Account-wide topic keywords, storage used, avg video length |
| GET | `/analytics/video/{video_id}` | Per-video views, `unique_viewers`, exports, processing time |

### `/users`
| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` 🔒 | Current profile |
| PUT | `/users/me` 🔒 | Update username/email |
| PUT | `/users/me/password` 🔒 | Local-password change (only meaningful for legacy accounts) |
| GET | `/users/me/activity` 🔒 | Reused for the Learner "History" page |
| GET | `/users` 🔒 (Administrator) | All users, for the Admin Panel's user table |
| PATCH | `/users/{id}/role` 🔒 (Administrator) | Promote/demote a role — the only way to create an Administrator after the first one |

### `/admin` — Administrator-only unless noted
| Method | Path | Notes |
|---|---|---|
| GET/PUT | `/admin/settings` | `maintenance_mode`, `allow_new_registrations`, `max_upload_size_mb` — all genuinely enforced elsewhere, not cosmetic |
| GET | `/admin/system-stats` | Users by role, videos by status, storage used |
| GET | `/admin/processing-jobs` | In-flight + recently completed AI jobs, per-video status |
| GET | `/admin/storage` | Videos sorted largest-first, for freeing space |
| GET | `/admin/audit-log` | Sensitive-action trail |

## Background AI processing

Only **transcription** runs automatically. `POST /upload/multipart/complete`
kicks off `process_video_transcription` as a FastAPI `BackgroundTasks` job
(no separate queue/worker process — it runs in-process on the FastAPI
server): download the object from R2 → extract audio via FFmpeg → Whisper
transcription → persist the `Transcript` row → auto-title the video from a
quick frequency-based keyword pass over the transcript (the same extractor
`/key-moments` uses, just without a model call) if the user hasn't already
renamed it → flip `Video.status` to `COMPLETED`.

**Summary, keywords, and key moments are generated on demand**, not
automatically chained after upload — a content manager (Creator/Educator/
Admin) explicitly triggers `POST /summary/generate` and
`POST /key-moments/generate` from the video detail page. Each persists its
own result independently and can be regenerated later without re-running
the others.

## Caching

`app/core/cache.py` wraps Redis with `get`/`set`/`delete` that silently
no-op if Redis is unreachable — the app is never *dependent* on it. Cached
reads: `GET /transcript/{id}`, `GET /summary/{id}`, `GET /analytics/dashboard`.
Every write path that could invalidate one of those (edit, regenerate,
delete) explicitly clears the relevant cache key.

## Testing

`backend/tests/conftest.py` sets `DATABASE_URL=sqlite:///./test.db` (plus
dummy R2 credentials and an unreachable Redis URL) **before** any `app.*`
module is imported, so the whole suite runs hermetically — no real
Postgres, R2, or Redis required, locally or in CI. `verify_firebase_id_token`
is monkeypatched in the Firebase-auth tests so nothing calls out to Google
either.

```bash
cd backend
venv/bin/pytest tests/ -v
```

Coverage highlights: the full upload → transcript → summary → key-moments
pipeline, RBAC per role (including that Administrator always passes
`require_role` checks), classrooms (ownership, membership, scoped
analytics), study materials (persistence, role guards), platform settings
(and that they're actually *enforced*, not just stored), and Firebase login
(new-account creation, re-auth, invalid token/role handling, and that an
explicit username wins over the Firebase display-name claim).
