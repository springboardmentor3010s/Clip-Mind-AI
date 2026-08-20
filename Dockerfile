FROM node:22-bookworm

# Install Python, FFmpeg and required system packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node dependencies
COPY package*.json ./
RUN npm ci

# Python dependencies
COPY requirements.txt ./
RUN python3 -m pip install --break-system-packages -r requirements.txt

# Application source
COPY . .

# Build frontend + Express server
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV FASTAPI_PORT=8001

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
