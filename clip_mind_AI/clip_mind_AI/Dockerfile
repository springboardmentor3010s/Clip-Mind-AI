# ClipMind AI — frontend image (Vite build served by nginx).

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first so this layer caches across source changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at BUILD time, so the API URL must be supplied here
# rather than at container start.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_CONTACT_EMAIL=
ENV VITE_CONTACT_EMAIL=$VITE_CONTACT_EMAIL

RUN npm run build

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Probe 127.0.0.1 explicitly rather than `localhost`, which can resolve to ::1.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
