# VeriHub - MumbaiHacks 2025

**AI-Powered Media Verification & Badge System**  
Team Size: 4 | Hackathon MVP

---

## Overview
**VeriHub** is a web platform that verifies media content using AI, generates dynamic badges for users, and provides quick reports. It integrates real-time updates and secure user authentication for a seamless experience.

**Key Features:**
- User Authentication (JWT)
- AI-Based Media Verification (DeepFake/Image Forensics)
- Dynamic Badge System
- Realtime Updates (Socket.io)
- Quick Report Generation (HTML/PDF)
- Cloud Storage (AWS S3 or local)

---

## Tech Stack

| Layer             | Technology / Tool                      |
| ----------------- | ------------------------------------- |
| Frontend          | React.js, Next.js, Tailwind CSS, MUI  |
| Backend           | Django REST Framework                 |
| Database          | PostgreSQL / MongoDB, Redis           |
| Storage           | AWS S3 / Local Storage                 |
| Auth              | JWT                                   |
| AI / Verification | OpenAI GPT, LangChain, FFmpeg         |
| Deployment        | Docker, Heroku / Vercel               |
| Realtime Updates  | WebSockets (FastAPI native)           |

---
## Setup Instructions

### Backend
1. Navigate to the backend folder:
```bash
cd backend

# Windows
..\venv\Scripts\activate
# Linux / Mac
source ../venv/bin/activate
pip install -r requirements.txt

--- 
### Frontend
cd frontend

npm install

npm run dev

