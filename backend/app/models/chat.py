from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    files: Optional[list] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatCreateResponse(BaseModel):
    chatId: str
    createdAt: datetime


class ChatHistoryResponse(BaseModel):
    chatId: str
    messages: List[ChatMessage]
    createdAt: datetime
    updatedAt: datetime


class ChatSummary(BaseModel):
    chatId: str
    title: str
    createdAt: datetime
    updatedAt: datetime


class ChatRenameRequest(BaseModel):
    title: str


