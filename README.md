<div align="center">

# 🎬 ClipMind AI

### **Turn long videos into clear insights, instantly.**

<p align="center">
  <b>AI-powered transcripts, summaries, and key moments — built for creators, educators, and teams who don't have time to watch everything.</b>
</p>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Faster-Whisper](https://img.shields.io/badge/Faster--Whisper-int8-orange)](https://github.com/SYSTRAN/faster-whisper)
[![Ollama](https://img.shields.io/badge/Ollama-Llama_3.2-black)](https://ollama.com)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📑 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Project Objectives](#-project-objectives)
- [User Roles](#-user-roles)
- [System Architecture](#-system-architecture)
- [AI Processing Workflow](#-ai-processing-workflow)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Docker Setup](#-docker-setup)
- [API Modules](#-api-modules)
- [Security](#-security)
- [Analytics](#-analytics)
- [Report Generation](#-report-generation)
- [Multilingual Support](#-multilingual-support)
- [Testing](#-testing)
- [Results](#-results)
- [Future Scope](#-future-scope)
- [References](#-references)
- [Project Information](#-project-information)

---

## 📖 Overview

ClipMind AI is a full-stack, AI-powered video intelligence platform that automatically analyzes uploaded videos or video URLs, extracts transcripts, generates concise summaries, and identifies important moments.

The platform is designed to help students, educators, content creators, media organizations, businesses, and online learning platforms consume long-form video content more efficiently.

### What makes ClipMind AI useful?

Instead of manually watching an entire video, users can:

- 🎙️ Generate a complete transcript
- 📝 Read an AI-generated summary
- 🔎 Find important moments with timestamps
- 🌐 Understand keywords in multiple languages
- 📚 Generate learning materials
- 📊 View content and engagement analytics
- 📄 Export reports for later use

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🎬 Video Upload | Upload videos directly to the platform |
| 🔗 URL Import | Import videos using supported video URLs |
| 🎙️ Speech-to-Text | Generate transcripts using Faster-Whisper |
| 📝 AI Summarization | Create concise and detailed summaries |
| ⏱️ Key Moments | Detect important moments and timestamps |
| 🌐 Multilingual Keywords | Explain keywords across multiple languages |
| 📚 Learning Materials | Generate study content and practice questions |
| 🔖 Bookmarks | Save important transcript sections |
| 👥 Role-Based Access | Separate permissions for different user roles |
| 📊 Analytics | Track videos, usage, and engagement |
| 📄 Reports | Export analytical reports as PDF/TXT |
| 🐳 Docker Support | Containerized deployment |

---

## 🎯 Project Objectives

- Reduce the time required to understand long-form videos.
- Automate video transcription and summarization.
- Detect important moments automatically.
- Provide a simple interface for different types of users.
- Support multilingual learning and keyword explanation.
- Provide analytics for educational and content workflows.
- Keep AI processing local/self-hosted where possible.

---

## 👥 User Roles

### 🎓 Learner
- Watch uploaded/shared videos
- Read transcripts and summaries
- Explore key moments
- Bookmark important content
- Access shared learning materials

### 👨‍🏫 Educator
- Upload lectures
- Edit transcripts
- Generate summaries
- Create learning materials
- Share content with learners
- Monitor analytics

### 🎥 Content Creator
- Manage video content
- Generate transcripts and highlights
- Create summaries
- Export reports
- Monitor content performance

### 🛡️ Administrator
- Manage users
- Manage roles and permissions
- Monitor processing jobs
- Manage platform content
- Review system activity

---

## 🏗️ System Architecture

![System Architecture](screenshots/System%20archietecture.jpeg)

---

## 🔄 AI Processing Workflow

![AI Processing Workflow](screenshots/AI%20processing%20workflow.jpeg)

---

## 🛠️ Technology Stack

### Frontend
- React 19
- Vite
- React Router
- Axios
- Recharts
- React Icons
- React Toastify

### Backend
- Python 3.11
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- psycopg2-binary

### AI / ML
- Faster-Whisper
- Ollama
- Llama 3.2
- Voice Activity Detection (VAD)

### Video Processing
- FFmpeg
- MoviePy
- yt-dlp

### Database
- PostgreSQL

### Security
- JWT Authentication
- Bcrypt Password Hashing
- Role-Based Access Control

### Deployment
- Docker
- Docker Compose

---

## 📂 Project Structure

```text
ClipMind-AI/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── upload.py
│   ├── transcript.py
│   ├── summary.py
│   ├── keymoments.py
│   ├── analytics.py
│   ├── database.py
│   ├── models.py
│   └── requirements.txt
│
├── uploads/
├── screenshots/
├── docker-compose.yml
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd ClipMind-AI
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Activate the environment:

**Windows**
```bash
venv\Scripts\activate
```

**Linux / macOS**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173

### 4. AI setup

Install Ollama and make sure the required Llama model is available locally.

```bash
ollama pull llama3.2
```

---

## 🐳 Docker Setup

Build the project:

```bash
docker compose build
```

Start all services:

```bash
docker compose up
```

Stop services:

```bash
docker compose down
```

---

## 🔌 API Modules

| Module | Purpose |
| :--- | :--- |
| `/register` | User registration |
| `/login` | User authentication |
| `/upload` | Video upload |
| `/upload-url` | Video URL ingestion |
| `/transcript` | Transcript processing |
| `/summary` | AI summary generation |
| `/keymoments` | Important moment detection |
| `/analytics` | Usage and engagement analytics |
| `/learning-materials` | Learning material generation |

---

## 🔐 Security

ClipMind AI includes:

- JWT-based authentication
- Bcrypt password hashing
- Role-based authorization
- Protected frontend routes
- Backend permission validation
- Request validation
- Token expiration
- Local/self-hosted AI inference

---

## 📊 Analytics

The analytics module can provide information such as:

- Total videos
- Video processing status
- Video views
- Summary reads
- Key moment navigation
- User activity
- Content performance
- Processing statistics

---

## 📄 Report Generation

The platform supports exporting generated information into:

- PDF reports
- TXT reports

Reports can include transcript, summary, key moments, and analytical information.

---

## 🌍 Multilingual Support

The keyword explanation workflow is designed to support multiple regional and international languages, including:

- English
- Tamil
- Hindi
- Telugu
- Malayalam
- Kannada
- Marathi
- Gujarati
- Bengali
- French
- German
- Spanish

---

## 🧪 Testing

The project testing covers:

- Authentication
- User registration and login
- Video upload
- URL ingestion
- Speech-to-text processing
- Summary generation
- Key moment detection
- Analytics
- Role-based access
- Docker deployment
- API communication

---

## 📈 Results

The project documentation reports that the evaluated 8-bit Faster-Whisper setup on an 8-core CPU achieved an average Real-Time Factor (RTF) of approximately 0.05, with a 60-minute video processed in under 3.5 minutes.

Previously processed transcripts and summaries can be served from cache in approximately 0.1 seconds, reducing repeated AI inference.

---

## 🚀 Future Scope

- Real-time live-stream summarization
- Mobile application
- Collaborative transcript editing
- Advanced recommendation system
- Speaker identification
- Emotion and sentiment analysis
- Advanced semantic video search
- Cloud-scale deployment

---

## 📚 References

- FastAPI
- Faster-Whisper
- Ollama
- React
- SQLAlchemy
- FFmpeg
- yt-dlp
- PostgreSQL

---

## 👨‍💻 Project Information

- **Project Name:** ClipMind AI
- **Project Type:** AI / Data Science / Full-Stack Application
- **Domain:** Artificial Intelligence & Video Intelligence
- **Application:** Video Summarization & Key Moments Detection

---

<div align="center">

🎬 **ClipMind AI — Turning long-form videos into searchable knowledge.**

</div>
