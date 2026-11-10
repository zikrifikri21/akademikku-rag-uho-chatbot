"""
UHO RAG API -- microservice internal yang dipanggil dari server Laravel (ChatStreamController / GuestChatStreamController).

Jalankan:  uvicorn main:app --host 0.0.0.0 --port 8001
Endpoint:  POST /api/rag/stream  (NDJSON, satu event per baris)
    {"eventType": "text_delta", "content": "..."}      # teks jawaban (sudah memuat baris "Sumber: dokumen, Pasal, halaman")
    {"eventType": "sources", "content": [{"title", "source", "asal", "pasal", "halaman", "halaman_akhir"}, ...]}
    {"eventType": "error", "content": "..."}

Catatan: jawaban dihasilkan utuh (mode JSON supaya sitasi bisa divalidasi) lalu dikirim bertahap,
jadi format stream tetap sama dengan yang dipakai frontend.
"""

import hmac
import json
import logging
import re
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

import config
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from rag_engine import init_engine, jawab, store
from schemas import StreamRequest

log = logging.getLogger("uho_rag")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_engine()
    yield


app = FastAPI(title="UHO RAG API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-Internal-Api-Key"],
)


def verifikasi_internal_key(x_internal_api_key: Optional[str]) -> None:
    """Kalau INTERNAL_API_KEY diset, wajib dikirim Laravel lewat header X-Internal-Api-Key."""
    if config.INTERNAL_API_KEY and not hmac.compare_digest(
        (x_internal_api_key or "").encode(), config.INTERNAL_API_KEY.encode()
    ):
        raise HTTPException(status_code=401, detail="Invalid or missing X-Internal-Api-Key")


def event_line(event_type: str, content) -> str:
    return json.dumps({"eventType": event_type, "content": content}, ensure_ascii=False) + "\n"


def potong_stream(teks: str, per_event: int = 4):
    kata = re.findall(r"\s*\S+", teks)
    for i in range(0, len(kata), per_event):
        yield "".join(kata[i:i + per_event])


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/rag/stream")
async def rag_stream(payload: StreamRequest, x_internal_api_key: Optional[str] = Header(default=None)):
    verifikasi_internal_key(x_internal_api_key)

    if payload.versi and not any(v["no"] == payload.versi for v in store.manifest.get("versi", [])):
        raise HTTPException(status_code=404, detail=f"Versi {payload.versi} tidak ada")

    def generate():
        try:
            riwayat = [{"role": m.role, "content": m.content} for m in payload.history[-config.MAX_RIWAYAT_DIPAKAI:]]
            teks, sumber = jawab(payload.message, riwayat, fakultas=payload.fakultas, model=payload.model, versi=payload.versi)
            for potongan in potong_stream(teks):
                yield event_line("text_delta", potongan)
            if sumber:
                yield event_line("sources", sumber)
        except Exception:
            log.exception("Stream gagal")       # detail hanya di log server, tidak dikirim ke klien
            yield event_line("error", "Terjadi kesalahan pada layanan. Silakan coba lagi.")

    return StreamingResponse(generate(), media_type="application/x-ndjson")


# ---------- Pengetahuan berversi (dipanggil dari halaman admin Laravel) ----------
MAKS_PDF = 50 * 1024 * 1024


@app.get("/api/knowledge")
def knowledge_list(x_internal_api_key: Optional[str] = Header(default=None)):
    verifikasi_internal_key(x_internal_api_key)
    return store.manifest


@app.post("/api/knowledge/upload")
def knowledge_upload(
    file: UploadFile = File(...),
    title: str = Form(..., min_length=3, max_length=200),
    fakultas: str = Form("UNIVERSITAS", max_length=50),
    source: str = Form("", max_length=500),
    catatan: str = Form("", max_length=500),
    ganti_doc_id: str = Form("", max_length=32),
    aktifkan: bool = Form(True),
    x_internal_api_key: Optional[str] = Header(default=None),
):
    """Sinkron (def) -> FastAPI menjalankannya di threadpool, embedding tidak memblokir chat."""
    verifikasi_internal_key(x_internal_api_key)
    data = file.file.read(MAKS_PDF + 1)
    if len(data) > MAKS_PDF or not data.startswith(b"%PDF"):
        raise HTTPException(status_code=422, detail="File harus PDF dan maksimal 50 MB")
    if ganti_doc_id and ganti_doc_id not in store.manifest["dokumen"]:
        raise HTTPException(status_code=422, detail="Dokumen yang mau diganti tidak ada")
    try:
        return store.tambah_pdf(data, title.strip(), fakultas.strip().upper() or "UNIVERSITAS",
                                source.strip() or f"upload:{file.filename}", catatan.strip(), ganti_doc_id or None, aktifkan)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/knowledge/versi/{no}/aktifkan")
def knowledge_aktifkan(no: int, x_internal_api_key: Optional[str] = Header(default=None)):
    verifikasi_internal_key(x_internal_api_key)
    try:
        store.aktifkan(no)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Versi {no} tidak ada")
    return {"aktif": no}
