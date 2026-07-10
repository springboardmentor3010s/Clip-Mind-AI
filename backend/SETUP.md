# ClipMind AI — Backend Setup (Milestone 1: Auth, RBAC, Video Upload & Processing)

## What's included
- `app/core/config.py` — env-based settings
- `app/core/database.py` — PostgreSQL (SQLAlchemy) session
- `app/core/mongo.py` — MongoDB (Motor) connection, ready for transcripts/summaries later
- `app/core/security.py` — password hashing + JWT create/decode
- `app/core/deps.py` — `get_current_user` (HTTPBearer) + `require_role()` for RBAC
- `app/models/user.py` — `User` model with 4 roles: content_creator, learner, educator, administrator
- `app/models/video.py` — `Video` model (uploaded video metadata, processing outputs, status)
- `app/schemas/user.py` / `app/schemas/video.py` — Pydantic request/response models
- `app/services/auth_service.py` — register/login business logic
- `app/services/video_service.py` — video upload validation, storage, and full FFmpeg
  processing pipeline (format standardization, key-frame thumbnail extraction, audio
  extraction with noise reduction)
- `app/api/v1/auth.py` — POST /register, /login, /refresh, GET /me
- `app/api/v1/users.py` — PATCH /users/me, admin-only GET /users, PATCH /users/{id}/deactivate
- `app/api/v1/videos.py` — POST /videos/upload, GET /videos, GET /videos/{video_id}
- `app/api/v1/router.py` — aggregates all v1 routes (placeholders for transcript/summary/key-moments/analytics modules to come)
- `app/main.py` — FastAPI app entrypoint

## 1. Copy files into your repo
Drop the `backend/app` contents into `C:\Dev\ClipMindAI\backend\app`, and copy
`requirements.txt` + `.env.example` into `C:\Dev\ClipMindAI\backend`.

## 2. Create virtual environment & install deps
```powershell
cd C:\Dev\ClipMindAI\backend
python -m venv clipmind-venv
.\clipmind-venv\Scripts\activate
pip install -r requirements.txt
```
> Note: `psycopg2-binary` requires a version with a prebuilt wheel for your Python
> version (e.g. `2.9.12` for Python 3.13 on Windows) to avoid needing the
> Microsoft C++ Build Tools. Also pin `bcrypt==4.0.1` explicitly — newer bcrypt
> releases break `passlib==1.7.4`'s password hashing.

## 3. Configure environment
```powershell
copy .env.example .env
```
Edit `.env`:
- Set `POSTGRES_PASSWORD` to your actual local Postgres password
- Update `DATABASE_URL` accordingly (**must match `POSTGRES_PASSWORD` exactly**)
- Generate a real secret for `JWT_SECRET_KEY`, e.g.:
  ```powershell
  python -c "import secrets; print(secrets.token_urlsafe(48))"
  ```

## 4. Create the Postgres database
```powershell
psql -U postgres -c "CREATE DATABASE clipmind_db;"
psql -U postgres -c "CREATE USER clipmind WITH PASSWORD 'change_me';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE clipmind_db TO clipmind;"
```
> On PostgreSQL 15+, you must **also** grant schema-level privileges (the
> database-level GRANT above is no longer sufficient on its own):
> ```powershell
> psql -U postgres -d clipmind_db -c "GRANT ALL ON SCHEMA public TO clipmind;"
> ```

## 5. Make sure MongoDB is running
Install MongoDB Community Edition (with "Install as a Service" checked so it
starts automatically) and verify it's running with MongoDB Compass or:
```powershell
mongosh
```
Default local URI `mongodb://localhost:27017` works if installed with defaults —
collections are created lazily when first written to, in a later milestone.

## 6. Make sure FFmpeg is installed
Required for the Video Processing Module: duration extraction (`ffprobe`), format
standardization, key-frame thumbnail extraction, and audio extraction with noise
reduction (`ffmpeg`). Verify with:
```powershell
ffmpeg -version
ffprobe -version
```

## 7. Run the API
```powershell
uvicorn app.main:app --reload
```
Visit **http://localhost:8000/docs** — Swagger UI should show `/api/v1/auth/*`,
`/api/v1/users/*`, and `/api/v1/videos/*` endpoints, plus `/health`.

## 8. Quick manual test
1. `POST /api/v1/auth/register` with a body like:
   ```json
   {"full_name": "Jane Doe", "email": "jane@example.com", "password": "SecurePass123", "role": "content_creator"}
   ```
2. `POST /api/v1/auth/login` with the same email/password → returns `access_token` + `refresh_token`.
3. Click "Authorize" in Swagger UI, paste the access token, then call `GET /api/v1/auth/me`.
4. Register a second user with `"role": "administrator"`, log in as them, and call
   `GET /api/v1/users` — should list all users. Try it as the non-admin user → should get `403`.
5. As any authenticated user, call `POST /api/v1/videos/upload` with an MP4/MOV/AVI/WebM
   file → should return `201` with file metadata, a detected `duration_seconds`, and three
   processing outputs: `processed_path` (standardized MP4), `thumbnail_path` (extracted
   key frame), and `audio_path` (denoised 16kHz mono WAV, ready for Whisper in Milestone 2).
   Note: this request takes noticeably longer than a plain upload (10-30+ seconds
   depending on video length) since it runs three FFmpeg operations synchronously.
6. Call `GET /api/v1/videos` → should list your uploaded video(s).
7. Call `GET /api/v1/videos/{video_id}` (using the `id` from step 5) → should return that
   video's details.
8. Check `storage/uploads` on disk — each upload should produce 4 files: the original,
   `..._standardized.mp4`, `..._thumb.jpg`, and `..._audio.wav`.

## What's NOT done yet (next milestones per PRD)
- Whisper transcript generation (Milestone 2)
- BART/T5 summarization (Milestone 2)
- Key moments detection (Milestone 3)
- Analytics dashboard (Milestone 3)
- Alembic migrations (currently using `create_all` for dev convenience — swap
  to Alembic before production)
- Cloud storage for uploaded videos (currently local disk under `storage/uploads`;
  PRD specifies AWS S3 / Blob storage for production)

## Notes / assumptions I made
- Used **UUID primary keys** for users and videos (safer for public-facing IDs
  than sequential ints).
- Roles are a Postgres enum matching your PRD's 4 roles exactly.
- Access tokens: 60 min; refresh tokens: 7 days (adjust in `.env`).
- `Base.metadata.create_all()` runs on startup for fast local iteration —
  replace with Alembic migrations once the schema stabilizes.
- Video upload is open to **any authenticated user** (not restricted to
  `content_creator`), per project decision.
- Uploaded videos are stored under `UPLOAD_DIR` (`./storage/uploads`) with a
  randomized filename (`stored_filename`) to avoid collisions; the original
  filename is preserved separately for display purposes.
- Swagger UI's "Authorize" button uses `HTTPBearer` (simple token paste) rather
  than the OAuth2 password flow, since the login endpoint accepts a custom JSON
  body (`email`/`password`) rather than the OAuth2 spec's `username`/`password`
  form fields.
- The FFmpeg processing pipeline (standardize, thumbnail, audio+noise-reduction)
  runs **synchronously** inside the upload request for simplicity. For larger
  files or production use, this should move to a background task queue
  (e.g. Celery/RQ) so the upload response isn't blocked — noted for a future
  milestone alongside the PRD's "Monitor AI processing jobs" admin feature.
- Audio is extracted at 16kHz mono specifically because that's Whisper's
  preferred input format, setting up Milestone 2 with minimal rework.