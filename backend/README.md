# VeriHub Backend (FastAPI + MongoDB)

Simple steps to run the backend locally and understand the available endpoints.

## 1) Prerequisites
- Python 3.11+ (works with 3.12)
- MongoDB Atlas connection string (or local MongoDB)

## 2) Setup
1. Create and activate a virtual environment (recommended):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   - Copy the template and fill your values
   ```bash
   cp .env.example .env
   ```
   - Edit `.env`:
   ```env
   MONGODB_URL=your_mongodb_connection_string
   DATABASE_NAME=verihub
   SECRET_KEY=your_super_secret_key_here
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

## 3) Run
```bash
uvicorn main:app --reload
```
Open Swagger docs at: http://localhost:8000/docs

## 4) Endpoints (Auth)
- POST `/signup` – Register user
  - Body: `{ "username": "string", "email": "user@example.com", "password": "string" }`
- POST `/signin` – Login and get JWT
  - Body: `{ "email": "user@example.com", "password": "string" }`
- GET `/me` – Current user profile (requires Bearer token)
- GET `/protected` – Example protected route

All responses are JSON. Use the Swagger UI to try them interactively.

## 5) Tips & Troubleshooting
- If you see `email-validator is not installed`, ensure `pydantic[email]` is in requirements and run `pip install -r requirements.txt` again.
- If bcrypt warnings appear, we pin a compatible version in `requirements.txt` (bcrypt==4.0.1). Reinstall dependencies if needed.
- If the server port is busy, run on a different port: `uvicorn main:app --reload --port 8001`.
- Ensure `.env` is loaded: we use `python-dotenv`. Restart the server after edits to `.env`.

## 6) Security
- `.env` is git-ignored – don’t commit secrets.
- Use a strong unique `SECRET_KEY` in production.
- Rotate credentials regularly and use per-environment values.
