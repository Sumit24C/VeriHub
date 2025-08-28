from fastapi import APIRouter, HTTPException
from typing import Any, Dict
from uuid import uuid4
from datetime import datetime

from app.core.database import get_database
from app.models.chat import (
    ChatMessage,
    ChatCreateResponse,
    ChatHistoryResponse,
    ChatSummary,
    ChatRenameRequest,
)


router = APIRouter()


def _now() -> datetime:
    return datetime.utcnow()


@router.post("/chats", response_model=ChatCreateResponse)
async def create_chat() -> ChatCreateResponse:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    chat_id = str(uuid4())
    now = _now()

    doc: Dict[str, Any] = {
        "chatId": chat_id,
        "messages": [],
        "title": "New Chat",
        "createdAt": now,
        "updatedAt": now,
    }
    await db["chats"].insert_one(doc)
    return ChatCreateResponse(chatId=chat_id, createdAt=now)


@router.get("/chats/{chat_id}", response_model=ChatHistoryResponse)
async def get_chat_history(chat_id: str) -> ChatHistoryResponse:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    chat = await db["chats"].find_one({"chatId": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return ChatHistoryResponse(
        chatId=chat["chatId"],
        messages=chat.get("messages", []),
        createdAt=chat["createdAt"],
        updatedAt=chat.get("updatedAt", chat["createdAt"]),
    )


@router.post("/chats/{chat_id}/messages", response_model=ChatHistoryResponse)
async def append_message(chat_id: str, message: ChatMessage) -> ChatHistoryResponse:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    chat = await db["chats"].find_one({"chatId": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Normalize message dict for storage
    message_to_store = message.model_dump()
    message_to_store.setdefault("timestamp", _now())

    # Auto-title on first user message if still default
    update_body: Dict[str, Any] = {
        "$push": {"messages": message_to_store},
        "$set": {"updatedAt": _now()},
    }
    if message.role == "user" and (not chat.get("title") or chat.get("title") == "New Chat"):
        preview = message.content.strip().split("\n")[0][:24]
        update_body["$set"]["title"] = preview if preview else "New Chat"

    await db["chats"].update_one(
        {"chatId": chat_id},
        update_body,
    )

    updated = await db["chats"].find_one({"chatId": chat_id})
    return ChatHistoryResponse(
        chatId=updated["chatId"],
        messages=updated.get("messages", []),
        createdAt=updated["createdAt"],
        updatedAt=updated.get("updatedAt", updated["createdAt"]),
    )


@router.get("/chats", response_model=list[ChatSummary])
async def list_chats() -> list[ChatSummary]:
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Do not exclude _id in projection to allow fallback if chatId is missing in legacy docs
    cursor = db["chats"].find({}, {"chatId": 1, "title": 1, "createdAt": 1, "updatedAt": 1}).sort("updatedAt", -1)
    results: list[ChatSummary] = []
    async for doc in cursor:
        # Fallbacks for legacy or malformed docs
        chat_id_value = doc.get("chatId") or (str(doc.get("_id")) if doc.get("_id") is not None else None)
        if chat_id_value is None:
            # Skip documents that cannot be identified
            continue
        created_at_value = doc.get("createdAt") or doc.get("updatedAt") or _now()
        updated_at_value = doc.get("updatedAt") or created_at_value
        title_value = doc.get("title") or "New Chat"
        results.append(ChatSummary(**{
            "chatId": chat_id_value,
            "title": title_value,
            "createdAt": created_at_value,
            "updatedAt": updated_at_value,
        }))
    return results


@router.patch("/chats/{chat_id}")
async def rename_chat(chat_id: str, body: ChatRenameRequest):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    res = await db["chats"].update_one({"chatId": chat_id}, {"$set": {"title": body.title, "updatedAt": _now()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"status": "ok"}


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    res = await db["chats"].delete_one({"chatId": chat_id})
    if res.deleted_count == 0:
        # Try legacy fallback by _id
        try:
            from bson import ObjectId  # type: ignore
            res = await db["chats"].delete_one({"_id": ObjectId(chat_id)})
        except Exception:
            res = None
    return {"status": "ok"}


