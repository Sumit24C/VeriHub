from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes.auth import router as auth_router
from app.routes.uploads import router as uploads_router
from app.routes.verify import router as verify_router

# FastAPI lifespan event
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()

app = FastAPI(title="VeriHub API", version="1.0.0", lifespan=lifespan)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:5173"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(uploads_router, prefix="/uploads", tags=["File Uploads"])
app.include_router(verify_router, prefix="/ai", tags=["File Uploads and text"])

@app.get("/")
async def root():
    return {"message": "Welcome to VeriHub API!", "status": "success"}