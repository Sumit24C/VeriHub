from pydantic import BaseModel
from app.models.user import UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
