from typing import Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Satu pesan riwayat percakapan, sesuai bentuk yang sudah dipetakan
    di ChatStreamController::buildConversationHistory / GuestChatStreamController."""

    role: str  # "user" atau "assistant"
    content: str


class StreamRequest(BaseModel):
    message: str = Field(..., max_length=1000)
    model: Optional[str] = None  # id model Groq, mis. "openai/gpt-oss-20b" -- dilewatkan apa adanya
    history: list[ChatMessage] = Field(default_factory=list)
    fakultas: Optional[str] = None  # opsional: batasi konteks ke fakultas tertentu


class SourceItem(BaseModel):
    title: Optional[str] = None
    source: Optional[str] = None
    asal: str  # "vector_store" atau "web_search"
