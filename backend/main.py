from fastapi import FastAPI, HTTPException, status, Depends
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection, get_database
from models import UserCreate, UserLogin, Token, UserResponse, UserInDB
from auth import (
    get_password_hash, 
    authenticate_user, 
    create_access_token, 
    get_current_user,
    get_user_by_email,
    get_user_by_username,
    user_to_response,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# FastAPI lifespan event
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()

app = FastAPI(title="VeriHub API", version="1.0.0", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Welcome to VeriHub API!", "status": "success"}

@app.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    db = get_database()
    
    # Check if user already exists
    existing_user_email = await get_user_by_email(user.email)
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_user_username = await get_user_by_username(user.username)
    if existing_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "is_active": True,
        "date_joined": datetime.utcnow()
    }
    
    # Insert user into database
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Create user response
    user_in_db = UserInDB(**user_data)
    user_response = user_to_response(user_in_db, user_id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.post("/signin", response_model=Token)
async def signin(user: UserLogin):
    # Authenticate user
    authenticated_user = await authenticate_user(user.email, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not authenticated_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user.email}, expires_delta=access_token_expires
    )
    
    # Get user ID from database
    db = get_database()
    user_data = await db.users.find_one({"email": authenticated_user.email})
    user_id = str(user_data["_id"])
    
    # Create user response
    user_response = user_to_response(authenticated_user, user_id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }

@app.get("/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    # Get user ID from database
    db = get_database()
    user_data = await db.users.find_one({"email": current_user.email})
    user_id = str(user_data["_id"])
    
    return user_to_response(current_user, user_id)

@app.get("/protected")
async def protected_route(current_user: UserInDB = Depends(get_current_user)):
    return {
        "message": f"Hello {current_user.username}!",
        "user_email": current_user.email,
        "is_active": current_user.is_active
    }