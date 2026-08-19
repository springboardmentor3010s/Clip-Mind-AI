# Running ClipMind AI

Two ways to start the stack. Pick one — **don't run both**, they fight over port 8000.

> **Paths below are relative.** Start from the folder that contains both project
> directories (`clip_mind_AI` and `clip_mind_AI_Backend`) — the commands work
> the same on any machine, no matter where you cloned them.

```bash
# Check you're in the right place — you should see both folders
ls
# clip_mind_AI    clip_mind_AI_Backend
```

---

## Option A — Docker (recommended)

Starts everything: Postgres, Redis, Django, Celery worker, frontend.

```bash
cd clip_mind_AI_Backend
docker compose --env-file .env.docker up -d --build
```

Migrations run automatically and the admin account is seeded on first boot.

| URL | What |
| --- | --- |
| http://localhost:3000 | Frontend |
| http://localhost:8000 | Backend API |
| http://localhost:8000/api/docs/ | Swagger |
| http://localhost:8000/admin/ | Django admin |
| http://localhost:8000/health/ | Health probe |

Admin login: `admin@clipmind.ai` / `AdminPass1!`

### Everyday commands

Run these from `clip_mind_AI_Backend`:

```bash
docker compose --env-file .env.docker ps                 # status
docker compose --env-file .env.docker logs -f worker     # watch AI pipeline
docker compose --env-file .env.docker logs -f backend    # API logs
docker compose --env-file .env.docker restart backend    # restart one service
docker compose --env-file .env.docker down               # stop
docker compose --env-file .env.docker down -v            # stop + wipe database
```

After changing frontend code, rebuild it (Vite bakes env vars at build time):

```bash
docker compose --env-file .env.docker up -d --build frontend
```

### If `docker` isn't found in Git Bash

Add Docker Desktop's bin folder to your PATH for the session:

```bash
export PATH="$PATH:$LOCALAPPDATA/Programs/DockerDesktop/resources/bin"
```

Or just use PowerShell, where it's already on the PATH.

---

## Option B — Local (no Docker)

Needs PostgreSQL, Memurai (Redis) and FFmpeg installed and running.

**Terminal 1 — Backend**
```bash
cd clip_mind_AI_Backend
.venv312/Scripts/activate          # Linux/macOS: source .venv312/bin/activate
python manage.py migrate
python manage.py runserver
```

**Terminal 2 — Celery worker** (required, or videos stay stuck at "pending")
```bash
cd clip_mind_AI_Backend
.venv312/Scripts/activate
celery -A config worker --pool=solo -l info
```
`--pool=solo` is mandatory on Windows.

**Terminal 3 — Frontend**
```bash
cd clip_mind_AI
npm run dev
```
Runs on **http://localhost:5173** (not 3000).

### One-time setup for local mode

Create `clip_mind_AI/.env`:
```
VITE_API_URL=http://localhost:8000
```

And in `clip_mind_AI_Backend/.env`, point these at the Vite port:
```
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Create an admin if you don't have one:
```bash
python manage.py createsuperuser
```

---

## Tests

```bash
# Docker (from clip_mind_AI_Backend)
docker compose --env-file .env.docker exec backend python manage.py test

# Local (from clip_mind_AI_Backend)
python manage.py test

# Frontend lint (from clip_mind_AI)
npm run lint
```

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Video stuck on "pending" | Celery worker isn't running |
| Processing fails at transcription | `GROQ_API_KEY` missing or out of quota |
| CORS error in browser console | `CORS_ALLOWED_ORIGINS` doesn't include the port you're on (3000 for Docker, 5173 for local) |
| Share link points at the wrong port | `FRONTEND_URL` mismatch |
| Port 8000 already in use | Docker stack is still up — `docker compose --env-file .env.docker down` |
| Frontend changes not showing | Rebuild the frontend image; Vite inlines env vars at build time |
| `docker compose` can't find `../clip_mind_AI` | Both folders must sit side by side in the same parent directory |
