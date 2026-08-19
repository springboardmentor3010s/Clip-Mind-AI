@echo off
echo ========================================================
echo         Starting ClipMind AI Project (Windows)
echo ========================================================

echo.
echo [1/2] Setting up and Starting Backend...
cd backend

if not exist "venv\" (
    echo [INFO] Python virtual environment not found. Creating one...
    python -m venv venv
)

echo [INFO] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo [INFO] Starting FastAPI Backend on Port 8000 in a new window...
start "ClipMind AI - Backend" cmd /c "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

cd ..

echo.
echo [2/2] Setting up and Starting Frontend...
cd frontend

if not exist "node_modules\" (
    echo [INFO] Node modules not found. Installing frontend dependencies...
    npm install
)

echo [INFO] Starting Next.js Frontend in a new window...
start "ClipMind AI - Frontend" cmd /c "npm run dev"

cd ..

echo.
echo ========================================================
echo   Success! Both servers are booting up in separate windows.
echo.
echo   - Frontend will be available at: http://localhost:3000
echo   - Backend will be available at:  http://localhost:8000
echo ========================================================
echo.
pause
