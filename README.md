# VeriHub - MumbaiHacks 2025

**AI-Powered Media Verification System**  
Team Size: 4 | Hackathon MVP

---

## Overview
**VeriHub** is a web platform that verifies media content using AI, generates dynamic badges for users, and provides quick reports. It integrates real-time updates and secure user authentication for a seamless experience.

**Key Features:**
- User Authentication (JWT)
- AI-Based Media Verification (DeepFake/Image Forensics)
- Quick Report Generation (HTML/PDF)

---

## Tech Stack

| Layer             | Technology / Tool                     |
| ----------------- | ------------------------------------- |
| Frontend          | React.js, Tailwind CSS, MUI           |
| Backend           | FastAPI                               |
| Database          | MongoDB                               |
| Storage           | cloudinary                            |
| Auth              | JWT                                   |
| AI                | Gemini, LangChain,                    |
| Deployment        | Docker, Render, Vercel                |

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

