# ClipMind AI — Milestone 4 Evaluation & Quickstart Guide (Windows & Cross-Platform)

This branch (`milestone-4`) combines **Milestone 2, 3 & 4 Features**:
- **Milestone 2**: OpenAI Whisper automatic speech-to-text transcription, FFmpeg audio extraction, interactive transcript viewer/editor, TXT export, and HuggingFace BART AI text summarization.
- **Milestone 3**: Key Moments NLP extraction, Global Cross-Video Transcript Search Engine, and Analytics Dashboard.
- **Milestone 4 (Week 7 & 8 — Testing, Deployment & Documentation)**: automated backend/frontend test suites, Redis-backed response caching, a more efficient analytics dashboard, chronological key-moment chaptering, clickable key-moment markers on the video scrubber, Docker Compose deployment, and CI pipelines.

---

## 💡 Easy Branch Switcher (Windows / Cross-Platform)
If you are on Windows, double-click `switch-milestone.bat` (or run `./switch-milestone.sh` on macOS/Linux) to switch between milestone branches interactively!

---

## 🐳 Milestone 4: Docker Deployment

The whole stack (Postgres, Redis, backend, frontend) can be brought up with a single command — no local Python/Node setup required.

1. Create a `.env` file in the repo root (docker-compose reads it automatically) with your Cloudflare R2 credentials — see `backend/.env.example` for the full list: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`.
2. Build and start everything:
   ```bash
   make up        # equivalent to: docker-compose up -d --build
   ```
3. Visit `http://localhost:3000` (frontend) and `http://localhost:8000/docs` (backend API docs).
4. Useful commands:
   ```bash
   make logs            # tail logs for every service
   make shell-backend   # shell into the backend container
   make db-shell        # psql into the Postgres container
   make down             # stop everything
   ```

Redis is used as an **optional** response cache (transcript/summary/analytics reads) — the backend runs identically with or without it, so a plain `venv`-based local run (no Docker) still works exactly as before.

---

## ✅ Milestone 4: Running the Test Suites

**Backend** (hermetic — uses an in-memory SQLite DB and mocks R2/Redis, no external services required):
```bash
cd backend
venv/bin/pytest tests/ -v
```

**Frontend**:
```bash
cd frontend
npm test
```

Or run both from the repo root: `make test`.

CI (`.github/workflows/backend-ci.yml`, `frontend-ci.yml`) runs both suites automatically on every push/PR touching `backend/` or `frontend/`.

---

## 🚀 Step-by-Step Setup & Running Guide

### Step 1: Database Setup (PostgreSQL)
Make sure PostgreSQL is running locally and create the database:

**Windows (Command Prompt / PowerShell):**
```cmd
psql -U postgres -c "CREATE DATABASE clipmind;"
```
*(Or run `CREATE DATABASE clipmind;` in SQL Shell (psql) / pgAdmin).*

---

### Step 2: Installing FFmpeg (Required for Whisper Audio Extraction)
Whisper speech recognition requires **FFmpeg** to extract audio from videos.

- **Windows:**
  - Option 1 (Winget): Open Command Prompt / PowerShell and run:
    ```cmd
    winget install ffmpeg
    ```
  - Option 2 (Chocolatey): `choco install ffmpeg`
  - Option 3: Download prebuilt zip from [gyan.dev/ffmpeg/builds](https://www.gyan.dev/ffmpeg/builds/), extract to `C:\ffmpeg` and add `C:\ffmpeg\bin` to your System PATH environment variables.
- **macOS:** `brew install ffmpeg`
- **Linux:** `sudo apt update && sudo apt install -y ffmpeg`

---

### Step 3: Backend Setup & Run

1. Open Command Prompt / PowerShell:
   ```cmd
   cd backend
   ```
2. Activate Python virtual environment:
   - **Windows:**
     ```cmd
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```cmd
   pip install -r requirements.txt
   ```
4. Start FastAPI server:
   ```cmd
   uvicorn app.main:app --reload --port 8000
   ```

---

### Step 4: Frontend Setup & Run

1. Open a new Command Prompt / PowerShell window:
   ```cmd
   cd frontend
   ```
2. Install Node dependencies & start dev server:
   ```cmd
   npm install
   npm run dev
   ```
   Open `http://localhost:3000`.

---

## 🎯 Showcasing Evaluation Features

### Milestone 2 Features
1. **Whisper Speech-to-Text Transcription**:
   - Upload a video file via the Dashboard (`http://localhost:3000/dashboard`).
   - When upload finishes, the backend automatically extracts audio via FFmpeg and runs `openai/whisper-tiny` locally in the background to produce real, timestamped transcript segments.
2. **Interactive Transcript Management**:
   - Open a video detail page (e.g., `http://localhost:3000/dashboard/video/1`).
   - View transcript segments synchronized with timestamps. Click any segment to seek the video player to that time.
   - Hover over a segment to edit transcript text live and save it (`PUT /transcript/{video_id}`).
   - Click **Export TXT** to download the transcript file.
3. **AI Summarization (NLP)**:
   - Click **Generate Summary** on the video page.
   - The backend runs HuggingFace DistilBART in the background to generate both a **Quick Summary** and **Detailed Notes**.
   - Switch between Quick/Detailed tabs, edit summaries, or click **Export TXT**.

### Milestone 3 Features
1. **Key Moments Detection (NLP Highlight Extraction)**:
   - Go to a video details page (e.g., `http://localhost:3000/dashboard/video/1`).
   - Click **Extract Key Moments**.
   - The NLP engine analyzes keyword density across transcript segments to extract top key moments with titles, descriptions, and exact start/end timestamps.
   - Click any key moment card to automatically skip the video player to that timestamp.
2. **Global Transcript Search Engine**:
   - Navigate to `http://localhost:3000/dashboard/search`.
   - Type any keyword or phrase spoken across uploaded videos (e.g., *"learning"* or *"data"*).
   - View matching segments grouped by video with clickable timestamp links that jump straight to that segment in the video.
3. **Analytics Dashboard**:
   - Navigate to `http://localhost:3000/dashboard/analytics`.
   - View total video views, total document exports, average AI processing speeds, and interactive activity timeline bars.

### Milestone 4 Features
1. **Improved Key Moment Detection**:
   - Key moments are now chronological chapters (~5 minute chunks) instead of a handful of isolated "highlight" segments — every part of a video gets a marker, not just the keyword-densest spots.
   - On a video's detail page, hover/click the colored segments on the video's scrubber to jump straight to that chapter.
2. **Content Insights**:
   - `GET /analytics/insights` returns account-wide topic keywords, total storage used, and average video length.
3. **Response Caching**:
   - `GET /transcript/{id}`, `GET /summary/{id}`, and `GET /analytics/dashboard` are cached in Redis (when available) and invalidated on every edit/regenerate/delete, so repeated dashboard polling and video-detail page loads don't re-hit Postgres or re-run aggregation queries every time.
4. **Automated Testing**:
   - `backend/tests/` covers the upload → transcript → summary → key-moments pipeline, the analytics/insights endpoints, and the keyword-extraction/chaptering logic — all against a hermetic in-memory SQLite DB with R2 calls mocked.
   - `frontend/__tests__/` covers `SummaryViewer`, `KeywordTags`, and the new `VideoPlayer` key-moment markers with React Testing Library.
5. **Docker Deployment**:
   - `docker-compose.yml` brings up Postgres, Redis, the FastAPI backend, and the Next.js frontend (built as a standalone production server) with one command — see the Docker section above.
