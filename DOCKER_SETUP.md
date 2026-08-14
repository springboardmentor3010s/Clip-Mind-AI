# ClipMind AI — Docker + GPU Setup (Windows / WSL2)

## 1. One-time host setup

1. **NVIDIA driver**: Install/update the regular Windows NVIDIA GPU driver
   (not a separate Linux driver — WSL2 shares the Windows driver). Get it from
   nvidia.com for your RTX 4050. This alone is what gives WSL2 access to CUDA.
2. **WSL2**: `wsl --install` (or `wsl --update` if already installed) in
   PowerShell. Docker Desktop requires the WSL2 backend, not Hyper-V.
3. **Docker Desktop**: Install it, then in
   Settings → General, confirm "Use the WSL 2 based engine" is checked.
4. **Enable GPU support**: Settings → Resources → WSL Integration, make sure
   your WSL distro is enabled. Docker Desktop bundles NVIDIA Container Toolkit
   support automatically on Windows — no separate `nvidia-container-toolkit`
   apt install needed like on bare Linux.
5. **Verify GPU is visible to Docker**:
   ```
   docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
   ```
   If this prints your RTX 4050 and driver version, you're set.

## 2. Project setup

```
# from the repo root
cp .env.example .env
```
Edit `.env` and fill in real values for `POSTGRES_PASSWORD` and
`JWT_SECRET_KEY` (generate one with
`python -c "import secrets; print(secrets.token_urlsafe(48))"`).

Also add `output: "standalone"` to `frontend/next.config.js` if you haven't
already (file included alongside this one).

## 3. Build and run

```
docker compose build
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs
- First run will download Whisper + BART model weights inside the backend
  container — this is slow once, then cached in the `hf-cache` /
  `whisper-cache` volumes for every rebuild after.

## 4. Common commands

```
docker compose logs -f backend      # tail backend logs
docker compose exec backend bash    # shell into backend container
docker compose down                 # stop everything, keep volumes/data
docker compose down -v              # stop and wipe DB/model cache too
```

## 5. If `--gpus all` fails or `nvidia-smi` isn't found in the container

- Double check the Windows NVIDIA driver is up to date.
- Restart Docker Desktop after a driver update.
- Run `wsl --update` and restart WSL (`wsl --shutdown` then reopen a terminal).