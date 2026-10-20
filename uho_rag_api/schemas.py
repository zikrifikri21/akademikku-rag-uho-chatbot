from typing import Optional

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Satu pesan riwayat percakapan (bentuk yang dipetakan ChatStreamController::buildConversationHistory)."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., max_length=2000)


class StreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    model: Optional[str] = Field(default=None, max_length=100)   # harus ada di ALLOWED_MODELS, kalau tidak dipakai model default
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)
    fakultas: Optional[str] = Field(default=None, max_length=50)  # opsional: dokumen fakultas itu + dokumen UNIVERSITAS
