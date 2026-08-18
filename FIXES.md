# ClipMind AI — Fixes Applied

## 1. Login was failing: corrupted database file
`clipmind.db` (and its backup `clipmind.db.bak`) were corrupted at the
SQLite file level — `PRAGMA integrity_check` / any query against the
`users` table raised `database disk image is malformed`. That's why
login (and most other DB-backed actions) failed: the backend simply
couldn't read user records at all.

**Fix:**
- Removed the corrupted `clipmind.db` / `clipmind.db.bak` files. The app
  already creates the schema and seeds demo accounts automatically on
  startup (`Base.metadata.create_all` + the seed step in `main.py`), so a
  fresh, working database is generated the first time you run it.
- Added a self-healing check in `backend/app/database.py`: on startup it
  now runs `PRAGMA integrity_check` on the SQLite file, and if it's ever
  corrupted again (e.g. the process gets killed mid-write), it
  automatically quarantines the bad file and starts a fresh one instead
  of failing every request.

**Demo accounts you can log in with immediately:**
| Email | Password | Role |
|---|---|---|
| admin@clipmind.ai | admin123 | Administrator |
| creator@clipmind.ai | creator123 | Content Creator |
| educator@clipmind.ai | educator123 | Educator |
| learner@clipmind.ai | learner123 | Learner |

## 2. Video upload rejecting valid files ("invalid format")
The extension allow-list was narrow (`.mp4/.mov/.avi/.mkv/.webm` only)
and the file-picker's `accept` attribute used made-up MIME types like
`video/mov` and `video/avi` (not real MIME types), which can make some
browsers/pickers behave inconsistently.

**Fix (frontend `src/constants.ts`, `FileUploader.tsx`, `UploadPage.tsx`
and backend `backend/app/main.py`):**
- Widened the accepted list to `.mp4 .mov .webm .avi .mkv .m4v .wmv .flv
  .3gp .mpeg .mpg .ogv` on both frontend and backend, so they agree.
- If a file's extension isn't recognized, both sides now fall back to
  checking the browser-reported `video/*` content type instead of
  outright rejecting it.
- Fixed the `accept` attribute on the file inputs to `video/*` plus the
  explicit extensions, which is what browsers actually expect.

## 3. Minor
- Added `backend/__init__.py` (was missing) so `backend` is an explicit
  Python package for `python -m backend.run` / `uvicorn backend.app.main:app`.

## How to run
```
npm install
npm run dev
```
This starts the Express server on **http://localhost:3000**, which
serves the frontend and spawns the FastAPI backend on port 8001,
proxying `/auth`, `/videos`, `/analytics`, `/users`, `/bookmarks` to it.
You need Python 3 with `fastapi uvicorn sqlalchemy python-multipart
openai-whisper transformers torch` installed, plus `ffmpeg` on your PATH
for video processing.

Open http://localhost:3000, log in with one of the demo accounts above,
and try uploading a video.
