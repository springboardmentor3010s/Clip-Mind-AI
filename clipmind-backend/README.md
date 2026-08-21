# ClipMind AI — FastAPI Backend

Local MVP backend for the ClipMind AI video summarization platform. No Docker,
no cloud services — SQLite on disk + FFmpeg + faster-whisper, all local.

## Structure

```
clipmind-backend/
├── main.py                  # FastAPI app, CORS, route registration, startup DB init
├── config.py                # env-driven settings (paths, CORS, whisper model)
├── requirements.txt
├── .env.example             # copy to .env to customize
├── models/
│   ├── database.py          # SQLAlchemy engine/session, init_db()
│   ├── db_models.py         # Video table + to_record() -> frontend VideoRecord shape
│   └── schemas.py           # Pydantic request/response models
├── services/
│   ├── ffmpeg_service.py    # duration probing + audio extraction
│   ├── whisper_service.py   # faster-whisper transcription (lazy-loaded model)
│   ├── nlp_service.py       # TextRank summarization + keyword extraction
│   ├── moments_service.py   # key-moment scoring (salience + keyword density + position)
│   ├── analytics_service.py # speaker share, keywords, sentiment timeline, aggregate stats
│   ├── time_utils.py        # fmt() / title_from_file() (mirrors frontend mockEngine.ts)
│   └── pipeline.py          # orchestrates transcript -> summary -> moments -> analytics
├── routes/
│   ├── videos.py            # POST /upload, GET/DELETE /videos
│   ├── transcript.py        # POST /generate-transcript, GET /transcript/{id}
│   ├── summary.py           # POST /generate-summary, GET /summary/{id}
│   ├── moments.py           # POST /generate-key-moments, GET /key-moments/{id}
│   ├── analytics.py         # GET /analytics, POST /generate-analytics
│   └── history.py           # GET /history (filters/sort), DELETE /history/{id}
└── data/                    # created at runtime: uploads/, audio/, clipmind.db
```

## 1. Install prerequisites

- **Python 3.10+**
- **FFmpeg** on PATH (needed for audio extraction + duration probing):
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: install from ffmpeg.org and add `ffmpeg.exe`/`ffprobe.exe` to PATH

Verify: `ffmpeg -version` and `ffprobe -version` should both print a version.

## 2. Set up the backend

```bash
cd clipmind-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # optional, defaults already work
```

## 3. Run it

```bash
uvicorn main:app --reload --port 8000
```

- API root: http://localhost:8000/
- Interactive docs (Swagger UI): http://localhost:8000/docs
- SQLite DB is created automatically at `data/clipmind.db` on first startup.

The first time you call `/api/generate-transcript`, faster-whisper will
download the `base` model (~150MB) from Hugging Face — this needs internet
access once; after that it's cached locally and runs fully offline.

## 4. Point the existing React frontend at it

The frontend's axios client (`src/services/api.ts`) uses:

```ts
baseURL: import.meta.env.VITE_API_URL || "/api"
```

All backend routes are mounted under `/api` to match that default. In the
frontend project root, create `.env.local` (Vite convention — this is a new
config file, not an edit to any existing source file):

```
VITE_API_URL=http://localhost:8000/api
```

Restart the Vite dev server after adding it.

## 5. Try the pipeline with curl

```bash
# 1. Upload
curl -F "file=@/path/to/video.mp4" http://localhost:8000/api/upload
# -> { "id": "...", "status": "Queued", ... }  copy the id as $VID

# 2. Transcript
curl -X POST http://localhost:8000/api/generate-transcript \
  -H "Content-Type: application/json" -d "{\"videoId\":\"$VID\"}"

# 3. Summary
curl -X POST http://localhost:8000/api/generate-summary \
  -H "Content-Type: application/json" -d "{\"videoId\":\"$VID\"}"

# 4. Key moments
curl -X POST http://localhost:8000/api/generate-key-moments \
  -H "Content-Type: application/json" -d "{\"videoId\":\"$VID\"}"

# 5. Analytics (also flips status to "Processed")
curl "http://localhost:8000/api/analytics?videoId=$VID"

# 6. History / library
curl "http://localhost:8000/api/history?sort=newest"

# Or run steps 2-5 in one call:
curl -X POST http://localhost:8000/api/process/$VID
```

## API contract reference

Matches `src/services/*.ts` and shapes in `src/utils/mockEngine.ts`:

| Frontend call | Backend route |
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

**Note on auth:** `src/services/auth.ts` defines `/login`, `/register`, etc.,
but `AuthContext.tsx` never actually calls them — auth is fully mocked
client-side via `localStorage`. No backend auth routes were added since
nothing in the current frontend calls them; say the word if you want real
auth wired up.
