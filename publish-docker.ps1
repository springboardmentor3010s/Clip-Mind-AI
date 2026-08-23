# PowerShell script to build and push Docker images for ClipMind AI
$ErrorActionPreference = "Stop"

$DOCKER_USER = "sararupa"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Building & Pushing ClipMind AI Containers " -ForegroundColor Cyan
Write-Host " Docker Username: $DOCKER_USER            " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Login to Docker Hub
Write-Host "`n[1/4] Logging into Docker Hub..." -ForegroundColor Yellow
docker login -u $DOCKER_USER

# 2. Build Backend
Write-Host "`n[2/4] Building Backend image..." -ForegroundColor Yellow
docker build -t ${DOCKER_USER}/clipmind-backend:latest ./backend

# 3. Build Frontend
Write-Host "`n[3/4] Building Frontend image..." -ForegroundColor Yellow
docker build -t ${DOCKER_USER}/clipmind-frontend:latest ./frontend

# 4. Push images to Docker Hub
Write-Host "`n[4/4] Pushing images to Docker Hub..." -ForegroundColor Yellow
docker push ${DOCKER_USER}/clipmind-backend:latest
docker push ${DOCKER_USER}/clipmind-frontend:latest

Write-Host "`n✅ Successfully uploaded images to Docker Hub:" -ForegroundColor Green
Write-Host "   - ${DOCKER_USER}/clipmind-backend:latest" -ForegroundColor Green
Write-Host "   - ${DOCKER_USER}/clipmind-frontend:latest" -ForegroundColor Green
