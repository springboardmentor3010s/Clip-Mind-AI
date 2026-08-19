#!/bin/bash

# ClipMind AI — Run backend (FastAPI/uvicorn) + frontend (Next.js) together.
# Usage: ./run.sh
# Stop both with Ctrl+C.

set -e
cd "$(dirname "$0")"

echo "=================================================="
echo "              ClipMind AI — Dev Runner             "
echo "=================================================="
echo ""

# --- Backend checks ---
if [ ! -d "backend/venv" ]; then
    echo "❌ backend/venv not found."
    echo "   Set it up first:"
    echo "     cd backend && python3 -m venv venv && venv/bin/pip install -r requirements.txt"
    exit 1
fi

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found — the backend may fail to start without DB/R2 credentials."
fi

# --- Frontend checks ---
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 frontend/node_modules not found, running npm install..."
    (cd frontend && npm install)
fi

# --- Start both, tearing both down on exit/Ctrl+C ---
PIDS=()

cleanup() {
    echo ""
    echo "Stopping servers..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    wait 2>/dev/null
    echo "Stopped."
}
trap cleanup EXIT INT TERM

echo "🚀 Starting backend  (FastAPI/uvicorn) on http://localhost:8000 ..."
(cd backend && venv/bin/uvicorn app.main:app --reload --port 8000) &
PIDS+=($!)

echo "🚀 Starting frontend (Next.js)         on http://localhost:3000 ..."
(cd frontend && npm run dev) &
PIDS+=($!)

echo ""
echo "=================================================="
echo "✅ Both servers are starting. Press Ctrl+C to stop."
echo "   Backend:  http://localhost:8000/docs"
echo "   Frontend: http://localhost:3000"
echo "=================================================="
echo ""

wait
