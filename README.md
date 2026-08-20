# ClipMind AI - Video Intelligence Platform

A comprehensive video intelligence platform that transforms video content into searchable, summarized, and actionable knowledge using AI-powered transcription, summarization, and key moment detection.

## 🚀 Phase 1 - Authentication & User Management

This is the first milestone of the ClipMind AI project, featuring a complete authentication system with JWT-based security, role-based access control, and a responsive React frontend.

## 📋 Features (Phase 1)

- ✅ User Registration with email verification
- ✅ Login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Role-Based Access Control (Administrator, Content Creator, Educator, Learner)
- ✅ User Profile management
- ✅ Admin dashboard for user management
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Swagger/OpenAPI API documentation
- ✅ Responsive React frontend with Tailwind CSS
- ✅ Docker deployment with docker-compose

## 🎓 Educator Features

Transform long educational content into concise learning resources. Available to **Educator** (and Administrator) accounts:

- ✅ **Upload lecture videos** — Educators can upload lectures and process them with AI (transcription, summaries, key moments)
- ✅ **Generate educational summaries** — AI summaries with bullet points, editable and reviewable by the educator
- ✅ **Review and edit transcripts** — Review, correct, and regenerate AI transcripts
- ✅ **Share summaries with students** — Create revocable share links (`/share/:token`) that let students view a lecture summary without editor access
- ✅ **Create learning materials from transcripts** — Generate structured study notes (key terms, flashcards, takeaways) or create them manually
- ✅ **Access classroom content analytics** — Aggregate analytics across all lectures (views, viewers, watch time, completion)
- ✅ **Monitor student engagement metrics** — Per-learner engagement: videos watched, watch time, completion, weekly activity (+ CSV export)

## 🛠️ Tech Stack

| Component        | Technology                            |
| ---------------- | ------------------------------------- |
| Frontend         | React.js + Vite + Tailwind CSS        |
| Backend          | FastAPI                               |
| Database         | PostgreSQL                            |
| ORM              | SQLAlchemy                            |
| Authentication   | JWT                                   |
| Password Hashing | bcrypt (passlib)                      |
| File Upload      | FastAPI UploadFile                    |
| Deployment       | Docker                                |

## 📁 Project Structure

```
clipmind-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── database/
│   │   │   └── database.py
│   │   ├── middleware/
│   │   ├── models/
│   │   │   ├── role.py
│   │   │   ├── user.py
│   │   │   ├── video.py
│   │   │   ├── transcript.py
│   │   │   ├── summary.py
│   │   │   ├── key_moment.py
│   │   │   ├── analytics.py
│   │   │   ├── bookmark.py
│   │   │   ├── processing_job.py
│   │   │   └── activity_log.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   └── admin.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── role.py
│   │   │   └── user.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   └── user_service.py
│   │   ├── utils/
│   │   ├── uploads/
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env
│   └── init.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── RoleMenu.jsx
│   │   │   ├── ProfileCard.jsx
│   │   │   └── DashboardCards.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Forbidden.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Services

| Service   | URL                    | Description              |
| --------- | ---------------------- | ------------------------ |
| Frontend  | http://localhost:3000  | React application        |
| Backend   | http://localhost:8000  | FastAPI application      |
| API Docs  | http://localhost:8000/docs | Swagger UI           |
| pgAdmin   | http://localhost:5050  | Database admin panel     |
| Database  | localhost:5432         | PostgreSQL               |

### Default Credentials

- **pgAdmin**: admin@clipmind.ai / admin123
- **Database**: clipmind_user / clipmind_pass

## 🔧 Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint              | Description         |
| ------ | --------------------- | ------------------- |
| POST   | `/api/auth/register`  | Register new user   |
| POST   | `/api/auth/login`     | Login & get token   |
| POST   | `/api/auth/logout`    | Logout              |

### User

| Method | Endpoint              | Auth Required | Description         |
| ------ | --------------------- | ------------- | ------------------- |
| GET    | `/api/users/me`       | Yes           | Get user profile    |
| PUT    | `/api/users/profile`  | Yes           | Update profile      |
| DELETE | `/api/users/delete`   | Yes           | Delete account      |

### Admin

#### Users, Roles & Content

| Method | Endpoint                          | Auth Required | Role          | Description                        |
| ------ | --------------------------------- | ------------- | ------------- | ---------------------------------- |
| GET    | `/api/admin/dashboard`            | Yes           | Administrator | Platform-wide dashboard counts     |
| GET    | `/api/admin/users`                | Yes           | Administrator | List all users                     |
| GET    | `/api/admin/users/{id}`           | Yes           | Administrator | Get user by ID                     |
| POST   | `/api/admin/users`                | Yes           | Administrator | Create a user                      |
| PUT    | `/api/admin/users/{id}`           | Yes           | Administrator | Update a user                      |
| PATCH  | `/api/admin/users/{id}/status`    | Yes           | Administrator | Activate / block a user            |
| PATCH  | `/api/admin/users/{id}/role`      | Yes           | Administrator | Change a user's role               |
| PATCH  | `/api/admin/users/{id}/reset-password` | Yes       | Administrator | Request a password reset           |
| DELETE | `/api/admin/users/{id}`           | Yes           | Administrator | Delete a user                      |
| GET    | `/api/admin/roles`                | Yes           | Administrator | List all roles                     |
| PUT    | `/api/admin/roles?role_id=`       | Yes           | Administrator | Update a role                      |
| GET    | `/api/admin/content`              | Yes           | Administrator | List all uploaded content          |
| DELETE | `/api/admin/content/{video_id}`   | Yes           | Administrator | Delete any uploaded video          |

#### Monitoring, Storage & Settings

| Method | Endpoint                    | Auth Required | Role          | Description                          |
| ------ | --------------------------- | ------------- | ------------- | ------------------------------------ |
| GET    | `/api/admin/activity`       | Yes           | Administrator | Monitor platform activity            |
| GET    | `/api/admin/activity/stats` | Yes           | Administrator | Aggregate activity statistics        |
| GET    | `/api/admin/audit-logs`     | Yes           | Administrator | Access the audit trail               |
| GET    | `/api/admin/jobs`           | Yes           | Administrator | Monitor AI processing jobs           |
| GET    | `/api/admin/jobs/stats`     | Yes           | Administrator | Processing job status counts         |
| GET    | `/api/admin/storage`        | Yes           | Administrator | Storage & resource utilization       |
| GET    | `/api/admin/analytics`      | Yes           | Administrator | View system analytics                |
| GET    | `/api/admin/settings`       | Yes           | Administrator | Read platform settings               |
| PUT    | `/api/admin/settings`       | Yes           | Administrator | Configure platform settings          |
| POST   | `/api/admin/reports/users`  | Yes           | Administrator | Export users report (CSV)            |
| POST   | `/api/admin/reports/content`| Yes           | Administrator | Export content report (CSV)          |
| POST   | `/api/admin/reports/activity`| Yes          | Administrator | Export activity report (CSV)         |

### Educator

| Method | Endpoint                                          | Auth Required | Role                 | Description                                  |
| ------ | ------------------------------------------------- | ------------- | -------------------- | -------------------------------------------- |
| POST   | `/api/videos/upload`                              | Yes           | Authenticated        | Upload a lecture video                       |
| GET    | `/api/videos/{id}/transcript`                     | Yes           | Owner or Published   | Get transcript                               |
| PUT    | `/api/videos/{id}/transcript`                     | Yes           | Owner                | Edit/review transcript                       |
| POST   | `/api/videos/{id}/summary/generate`               | Yes           | Owner                | Generate AI educational summary              |
| PUT    | `/api/videos/{id}/summary/`                       | Yes           | Owner                | Edit summary                                 |
| POST   | `/api/videos/{id}/learning-materials/generate`    | Yes           | Owner                | Generate study notes from transcript         |
| GET    | `/api/videos/{id}/learning-materials`             | Yes           | Owner or Published   | List learning materials                      |
| POST   | `/api/videos/{id}/learning-materials`             | Yes           | Owner                | Create manual study notes                    |
| PUT    | `/api/videos/{id}/learning-materials/{mid}`       | Yes           | Owner                | Update study notes                           |
| DELETE | `/api/videos/{id}/learning-materials/{mid}`       | Yes           | Owner                | Delete study notes                           |
| POST   | `/api/videos/{id}/shares`                         | Yes           | Owner                | Create a summary share link (idempotent)     |
| GET    | `/api/videos/{id}/shares`                         | Yes           | Owner                | List share links                             |
| DELETE | `/api/videos/{id}/shares/{share_id}`              | Yes           | Owner                | Revoke a share link                          |
| GET    | `/api/shares/{token}`                             | No            | Public               | Open a shared summary (students)             |
| GET    | `/api/educator/analytics`                         | Yes           | Educator/Admin       | Classroom content analytics                  |
| GET    | `/api/educator/analytics/engagement`              | Yes           | Educator/Admin       | Student engagement metrics                   |
| GET    | `/api/educator/analytics/engagement/export`       | Yes           | Educator/Admin       | Export engagement metrics (CSV)              |

## 👥 Roles

| Role              | Description                        |
| ----------------- | ---------------------------------- |
| Administrator     | Full system access and management  |
| Content Creator   | Upload and manage video content    |
| Educator          | Upload lectures, generate summaries & study materials, share summaries, monitor classroom analytics and student engagement |
| Learner           | View and interact with content     |

## 📊 Database Schema

The database includes the following tables:

- **users** - User accounts with role associations
- **roles** - Role definitions for RBAC
- **videos** - Video metadata and file information
- **transcripts** - AI-generated transcripts
- **summaries** - AI-generated summaries
- **key_moments** - Detected key moments in videos
- **analytics** - Video viewing analytics
- **bookmarks** - User-saved bookmarks
- **processing_jobs** - Background processing job tracking
- **activity_logs** - User activity audit logs
- **learning_materials** - Educator-created study notes (key terms, flashcards, takeaways)
- **summary_shares** - Revocable share links for video summaries

## 🚧 Roadmap

- **Phase 2**: Video Upload, FFmpeg Integration, Whisper Speech-to-Text, AI Summarization, Key Moments Detection, Analytics Dashboard
- **Phase 3**: Advanced AI features, multi-language support, collaborative features

## 📄 License

This project is part of the ClipMind AI capstone project.
# ClipMindAI
