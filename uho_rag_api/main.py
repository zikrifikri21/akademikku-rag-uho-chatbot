"""
UHO RAG API -- microservice internal yang dipanggil dari server Laravel
(ChatStreamController / GuestChatStreamController) untuk menggantikan
pemanggilan Prism/Groq langsung dengan jawaban yang dilandasi RAG
(vector store hasil scraping+PDF, dengan fallback web search live).

Jalankan:
    uvicorn main:app --host 0.0.0.0 --port 8001

Endpoint utama: POST /api/rag/stream
Format tiap baris NDJSON yang di-stream, kompatibel dengan format yang sudah
dipakai frontend React (eventType text_delta / error), plus tambahan "sources":
    {"eventType": "text_delta", "content": "..."}
    {"eventType": "sources", "content": [{"title": ..., "source": ..., "asal": ...}, ...]}
    {"eventType": "error", "content": "..."}
"""

import json
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv

load_dotenv()  # WAJIB dipanggil sebelum import rag_engine, supaya GROQ_API_KEY/TAVILY_API_KEY/CHROMA_DIR dari .env terbaca

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from rag_engine import init_engine, ambil_konteks, get_llm, SYSTEM_PROMPT
from schemas import StreamRequest

INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY")  # opsional: shared secret dengan Laravel
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost").split(",")]

MAX_RIWAYAT_DIPAKAI = 10  # jumlah pesan terakhir dari history yang disertakan ke prompt


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_engine()
    yield


app = FastAPI(title="UHO RAG API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verifikasi_internal_key(x_internal_api_key: Optional[str] = Header(default=None)) -> None:
    """Kalau INTERNAL_API_KEY diset di .env, wajib dikirim Laravel lewat header ini.
    Kosongkan INTERNAL_API_KEY di .env untuk menonaktifkan pengecekan ini saat development."""
    if INTERNAL_API_KEY and x_internal_api_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Internal-Api-Key")


def event_line(event_type: str, content) -> str:
    return json.dumps({"eventType": event_type, "content": content}, ensure_ascii=False) + "\n"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/rag/stream")
async def rag_stream(payload: StreamRequest, x_internal_api_key: Optional[str] = Header(default=None)):
    verifikasi_internal_key(x_internal_api_key)

    def generate():
        try:
            konteks, sumber = ambil_konteks(payload.message, fakultas=payload.fakultas)

            riwayat_terpakai = payload.history[-MAX_RIWAYAT_DIPAKAI:]
            riwayat_teks = "\n".join(f"{m.role}: {m.content}" for m in riwayat_terpakai)

            prompt = (
                (f"Riwayat percakapan sebelumnya:\n{riwayat_teks}\n\n" if riwayat_teks else "")
                + f"Konteks:\n{konteks}\n\n"
                + f"Pertanyaan mahasiswa: {payload.message}\n\n"
                + "Jawab dengan jelas dan ringkas dalam Bahasa Indonesia."
            )

            llm = get_llm(payload.model)
            for chunk in llm.stream([("system", SYSTEM_PROMPT), ("human", prompt)]):
                if chunk.content:
                    yield event_line("text_delta", chunk.content)

            if sumber:
                sumber_unik, seen = [], set()
                for m in sumber:
                    if m["source"] not in seen:
                        seen.add(m["source"])
                        sumber_unik.append(m)
                yield event_line("sources", sumber_unik)

        except Exception as e:
            yield event_line("error", f"Stream failed: {e}")

    return StreamingResponse(generate(), media_type="application/x-ndjson")
