FROM node:20-alpine

# Install FFmpeg & OpenSSL (for Prisma)
RUN apk add --no-cache ffmpeg openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

RUN mkdir -p uploads logs

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]

