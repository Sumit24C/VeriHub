from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool
    date_joined: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str
    is_active: bool = True
    date_joined: datetime