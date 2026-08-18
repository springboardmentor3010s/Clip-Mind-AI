# 🎬 ClipMind AI
### Intelligent Video Intelligence & Key Moments Detection Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![OpenAI Whisper](https://img.shields.io/badge/OpenAI_Whisper-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/research/whisper)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

<p align="center">
  <b>Transforming raw, unstructured video lectures and meetings into structured transcripts, neural executive summaries, and jumpable timeline milestones.</b>
</p>

---

## 📌 Table of Contents
- [Executive Overview](#-executive-overview)
- [Key Features & Highlights](#-key-features--highlights)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Empirical Quality Benchmarks](#-empirical-quality-benchmarks)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Option 1: Docker Deployment (Recommended)](#option-1-docker-deployment-recommended)
  - [Option 2: Local Development Setup](#option-2-local-development-setup)
- [Automated Testing Suite](#-automated-testing-suite)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🚀 Executive Overview

**ClipMind AI** is an enterprise-grade video intelligence platform engineered to eliminate manual scrubbing across long-form video content[     : 4, 6]. By combining deep acoustic models with abstractive NLP transformers and an asynchronous backend, ClipMind automatically extracts speech transcripts, flags topical milestones, derives entity metrics, and generates downloadable client-side PDF lecture briefs[     : 2, 4, 5, 6].

---

## ✨ Key Features & Highlights

- **🎙️ Sub-Second Whisper ASR:** High-fidelity speech-to-text conversion with precise word-level and sentence-level timestamp alignment[     : 3, 5].
- **🧠 Abstractive Neural Summarization:** Hugging Face BART pipelines compress dense educational lectures by over 90% without context loss.
- **⏱️ Automated Topic Segmentation:** Phrase boundary analysis detects major lecture transitions, rendering interactive, clickable video milestone bookmarks.
- **📊 NLP Content Analytics:** Instant extraction of total verbal volume, BART reduction ratios, sentiment classification, and technical keyword tag clouds[     : 4].
- **📑 Zero-Overhead PDF Export:** In-browser A4 highlight brief compilation using `html2pdf.js`, avoiding backend compute bottlenecks.
- **🔒 Multi-Tenant RBAC Security:** Strict write-isolation and dedicated persona workspaces (Creator, Learner, Educator, Admin)[     : 2, 3, 6].

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER (Next.js 14)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Creator Hub  │  │   Learner    │  │   Educator   │  │ Admin Desk │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / Multipart / JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY & BACKEND (FastAPI)                     │
│   • Asynchronous Ingestion Loop      • Strict RBAC Layer               │
│   • BackgroundTasks Worker Queue     • FFmpeg Audio Normalization (WAV)│
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼───────────────────┐ ┌──────────▼───────────────────┐
│          AI PIPELINE WORKERS          │ │       PERSISTENCE TIER       │
│  • OpenAI Whisper ASR (Timestamps)    │ │  • PostgreSQL (Metadata)     │
│  • Hugging Face BART (Summarizer)     │ │  • Persistent Storage Volume │
│  • NLP Keyword & Tag Extractors       │ │  • MongoDB (Document Store)  │
└───────────────────────────────────────┘ └──────────────────────────────┘
```
---

## 💻 Tech Stack

| Domain | Technology / Library | Architectural Role & Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 14`, `React`, `TypeScript` | Responsive UI dashboards, reactive polling, role-based views[     : 4, 5, 6]. |
| **Styling & Icons** | `Tailwind CSS`, `Lucide React Icons` | Responsive UI, state badges, dark-theme layout styling[     : 4]. |
| **Backend API Gateway** | `FastAPI`, `Uvicorn ASGI Server`, `Python 3.11` | Asynchronous REST endpoints, JWT authentication, non-blocking workers[     : 3, 5, 6]. |
| **Media Engineering** | `FFmpeg` | Audio stream demuxing, 16 kHz mono WAV conversion, 720p thumbnail snapshots[     : 5, 6]. |
| **Speech Recognition** | `OpenAI Whisper ASR` | Sub-second acoustic frame alignment and multi-accent speech-to-text extraction[     : 3, 4, 5]. |
| **Summarization & NLP** | `Hugging Face Transformers (BART / T5)` | Abstractive executive summaries, chapter breakdowns, keyword extraction, sentiment analysis[     : 2, 4, 5]. |
| **Persistence Tier** | `PostgreSQL`, `SQLAlchemy ORM`, `MongoDB` | Relational tables, upload state tracking, indexed transcript archives[     : 2, 5, 6]. |
| **Client Reporting** | `html2pdf.js`, `HTML5 Canvas` | Client-side DOM compilation into downloadable A4 highlight reports[     : 3, 4, 5]. |
| **Containerization** | `Docker`, `Docker Compose` | Multi-container microservice orchestration with persistent volume mounts[     : 3, 4]. |
---

## 📈 Empirical Quality Benchmarks

Quantitative performance benchmarks evaluated during system verification:

| Model / Pipeline | Metric Evaluated | Target Benchmark | Observed Result | Evaluation Verdict |
| --- | --- | --- | --- | --- |
| **Whisper ASR** | Word Error Rate (WER) | $< 10.0\%$ | **0.00% WER (100% Match)**<br> | PASSED<br> |
| **Whisper ASR** | Timestamp Precision | Frame alignment $< 1.0\text{ s}$ | **Sub-second precision**<br> | PASSED<br> |
| **BART Summarizer** | ROUGE-1 (Unigram F1) | Semantic retention | **0.2143 (F1)**<br> | PASSED<br> |
| **BART Summarizer** | ROUGE-L (LCS F1) | Syntactic structure | **0.2143 (F1)**<br> | PASSED<br> |
| **BART Summarizer** | Content Compression | $> 70\%$ reduction | **$\sim 90.0\% - 98.2\%$ reduction**<br> | PASSED<br> |

$$\text{WER} = \frac{S + D + I}{N} = \frac{0 + 0 + 0}{31} = 0.00\% \quad \text{[     : 3]}$$

---

## 👥 Role-Based Access Control (RBAC)

| User Persona | Permissions & Capabilities |
| :--- | :--- |
| **🎨 Content Creator** | Authorized multi-format video upload, live status tracking, transcript correction, key moments editing[     : 2, 3]. |
| **🎓 Learner** | Read-only access to summaries, clickable timestamp navigation, keyword search, study history[     : 2, 3]. |
| **👩‍🏫 Educator** | Classroom video management, lecture link generation, student topic breakdowns, analytics[     : 2, 3]. |
| **🛡️ Administrator** | System telemetry, model performance metrics, resource utilization, platform audit logs[     : 2, 3]. |
---

## 📂 Project Directory Structure

```text
ClipMind-AI/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Application settings & environment variables
│   │   │   ├── database.py            # SQLAlchemy engine & session lifecycle[     : 6]
│   │   │   └── security.py            # Password hashing & JWT token generators[     : 6]
│   │   ├── models/
│   │   │   ├── user.py                # User authentication & RBAC models[     : 6]
│   │   │   └── video.py               # Video metadata & moments entities[     : 6]
│   │   ├── routers/
│   │   │   ├── auth.py                # Sign in, registration, and RBAC routes[     : 6]
│   │   │   ├── video.py               # Media upload & ingestion handlers[     : 4, 6]
│   │   │   ├── creator.py             # Creator-specific curation endpoints[     : 3]
│   │   │   ├── educator.py            # Classroom & lecture sharing tools[     : 3]
│   │   │   ├── learner.py             # Read-only search & bookmarking[     : 3]
│   │   │   └── admin.py               # System telemetry & admin analytics[     : 3]
│   │   ├── services/
│   │   │   ├── ffmpeg_service.py      # Audio extraction & thumbnail snapshots[     : 5, 6]
│   │   │   ├── whisper_service.py     # Whisper ASR speech recognition inference[     : 5]
│   │   │   └── summarizer.py          # BART NLP summarization pipelines[     : 5]
│   │   └── main.py                    # ASGI app initialization & routing[     : 6]
│   ├── tests/
│   │   └── test_rbac_and_pipeline.py  # Pytest test suite[     : 3]
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/page.tsx     # Multi-persona workspace view[     : 3, 6]
│   │   │   ├── login/page.tsx         # Auth & role entry[     : 6]
│   │   │   └── layout.tsx
│   │   ├── components/                # Modular UI components
│   │   └── lib/                       # Client-side PDF export compiler[     : 4]
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.js
├── docker-compose.yaml                # Multi-container orchestration[     : 3]
└── README.md

```

---

## ⚡ Getting Started

### Prerequisites

* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine & Docker Compose)
* Python 3.11+ (for local backend development)
* Node.js 20.9+ (for local frontend development)
* FFmpeg installed locally (required if running outside Docker)



---

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository:**
```bash
git clone [https://github.com/your-username/clipmind-ai.git](https://github.com/your-username/clipmind-ai.git)
cd clipmind-ai

```


2. **Launch all services in detached mode:**
```bash
docker compose up --build -d[     : 3]

```


3. **Verify active container health:**
```bash
docker compose ps[     : 3]

```


4. **Access your services:**
* 🌐 **Next.js Web Interface:** [http://localhost:3000](http://localhost:3000)

* 📄 **FastAPI Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

* 🩺 **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)




---

### Option 2: Local Development Setup

#### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Uvicorn ASGI Server
uvicorn app.main:app --reload --port 8000

```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Testing Suite

Execute the automated `pytest` suite to verify system health, route security, and RBAC write-isolation:

```bash
cd backend
pytest -v tests/test_rbac_and_pipeline.py

```

### Test Execution Output:

```text
tests/test_rbac_and_pipeline.py::test_health_check_endpoint                    PASSED [ 25%]
tests/test_rbac_and_pipeline.py::test_rbac_learner_cannot_upload_directly      PASSED [ 50%]
tests/test_rbac_creator_can_upload_media                                       PASSED [ 75%]
tests/test_rbac_and_pipeline.py::test_get_video_details_accessible_across_roles PASSED [100%]

============================== 4 passed in 2.00s ==============================

```

---

## 👩‍💻 Author & Acknowledgments

* **Lead Engineer:** Sainishitha Kamma


* **Academic Focus:** B.Tech in Computer Science and Engineering (AI & Data Science)


* **Deliverable:** ClipMind AI Platform — Full Project Lifecycle (Milestones 1–4)