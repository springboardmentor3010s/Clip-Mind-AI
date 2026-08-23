# ClipMind AI 🎬

> AI-powered video summarization & key moments detection platform

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Vanilla CSS |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Queue | Bull + Redis |
| AI | OpenAI Whisper (transcription), GPT-4o (summaries) |
| Video | FFmpeg (thumbnails, audio extraction) |
| Infra | Docker Compose, Nginx |

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7
- FFmpeg (install from https://ffmpeg.org/download.html)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
npx prisma generate

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# backend/.env (already created — edit as needed)
DATABASE_URL="postgresql://clipmind:clipmind123@localhost:5432/clipmind_db"
JWT_SECRET=your-secret-here
OPENAI_API_KEY=sk-your-key-here   # Optional — mocks used if not set
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Set up Database

```bash
cd backend

# Create the database (in psql):
# CREATE USER clipmind WITH PASSWORD 'clipmind123';
# CREATE DATABASE clipmind_db OWNER clipmind;

npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Dev Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev     # http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev     # http://localhost:3000
```

## Demo Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@clipmind.ai | Admin@123 |
| Content Creator | creator@clipmind.ai | Creator@123 |
| Educator | educator@clipmind.ai | Educator@123 |
| Learner | learner@clipmind.ai | Learner@123 |

## Docker Deployment

```bash
# Build & run all services
docker-compose up --build

# The app will be available at http://localhost:80
```

## Project Structure

```
clipmind-ai/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Demo data
│   ├── src/
│   │   ├── server.js          # Express app entry
│   │   ├── routes/            # API route definitions
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, RBAC, upload, error
│   │   ├── services/          # FFmpeg, Whisper, OpenAI
│   │   ├── jobs/              # Bull job queue
│   │   └── utils/             # Logger
│   └── uploads/               # Video files (local)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── dashboard/         # Main dashboard
│   │   ├── videos/            # Video list + detail
│   │   ├── upload/            # Upload page
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── admin/             # Admin panel
│   │   └── browse/            # Browse public videos
│   └── lib/
│       ├── api.ts             # API client + utilities
│       └── auth.tsx           # Auth context (JWT)
│
├── docker-compose.yml
└── nginx.conf
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/videos | List videos |
| POST | /api/videos | Upload video |
| GET | /api/videos/:id | Get video details |
| POST | /api/videos/:id/process | Trigger AI processing |
| GET | /api/transcripts/:videoId | Get transcript |
| GET | /api/summaries/:videoId | Get AI summary |
| GET | /api/key-moments/:videoId | Get key moments |
| GET | /api/analytics/overview | Analytics overview |
| GET | /api/admin/users | Admin: list users |
| GET | /api/admin/jobs | Admin: list jobs |

## AI Processing Flow

```
Upload Video
    ↓ FFmpeg extracts thumbnail + audio
    ↓ Video status → READY
    ↓ [Trigger AI Analysis]
    ↓ Bull Queue → Whisper transcription
    ↓ Bull Queue → GPT-4o summary + keywords
    ↓ Bull Queue → GPT-4o key moments detection
    ↓ Results stored in PostgreSQL
```

> **Note:** If `OPENAI_API_KEY` is not set, realistic mock data is used automatically so all UI features remain functional.
