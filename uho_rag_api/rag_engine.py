"""
Modul Orchestrator / Facade RAG: Menggabungkan VectorStoreDAO, WebSearchDAO, dan LLMService
untuk menyediakan layanan RAG terpadu bagi main.py.
"""

import os
from typing import Optional

import config
from llm import LLMService
from vector_store import VectorStoreDAO
from web_search import WebSearchDAO

# Re-export konstanta agar kompatibel dengan main.py & import lama
SYSTEM_PROMPT = config.SYSTEM_PROMPT
PESAN_TIDAK_TERSEDIA = config.PESAN_TIDAK_TERSEDIA

# Singleton instances
_vector_store_dao = VectorStoreDAO()
_web_search_dao = WebSearchDAO()
_llm_service = LLMService()


def init_engine() -> None:
    """Inisialisasi semua komponen RAG (vector store, web search, LLM key check)."""
    _vector_store_dao.init_store()
    _web_search_dao.init_search(_vector_store_dao.domain_terverifikasi)

    print(f"[rag_engine] Vector store dimuat: {len(_vector_store_dao.document_titles)} dokumen unik.")
    print(f"[rag_engine] Domain terverifikasi untuk web search: {_web_search_dao.domain_terverifikasi}")
    print(f"[rag_engine] Web search fallback: {'aktif' if _web_search_dao.tavily_client else 'nonaktif (TAVILY_API_KEY kosong)'}")

    active_providers = []
    if config.GROQ_API_KEY:
        active_providers.append("Groq (Default)")
    if config.OPENAI_API_KEY:
        active_providers.append("OpenAI")
    if config.ANTHROPIC_API_KEY:
        active_providers.append("Anthropic/Claude")
    if config.GOOGLE_API_KEY:
        active_providers.append("Google Gemini")

    if not active_providers:
        raise RuntimeError(
            "Tidak ada LLM Provider API Key yang terdeteksi di .env! "
            "Pastikan setidaknya GROQ_API_KEY atau OPENAI_API_KEY / ANTHROPIC_API_KEY / GOOGLE_API_KEY diisi di file .env."
        )
    print(f"[rag_engine] Provider LLM Aktif: {', '.join(active_providers)}")


def get_llm(model: Optional[str] = None):
    return _llm_service.get_llm(model)


def kontekstualisasi_pertanyaan(pertanyaan: str, riwayat: list[dict]) -> str:
    return _llm_service.kontekstualisasi_pertanyaan(pertanyaan, riwayat)


def cari_dokumen_disebut(pertanyaan: str, threshold: float = config.DOCUMENT_MATCH_THRESHOLD) -> Optional[str]:
    return _vector_store_dao.cari_dokumen_disebut(pertanyaan, threshold)


def cari_web_uho(pertanyaan: str, max_results: int = config.WEB_SEARCH_MAX_RESULTS) -> list[dict]:
    return _web_search_dao.cari_web_uho(pertanyaan, max_results)


def ambil_konteks(
    pertanyaan: str, fakultas: Optional[str] = None
) -> tuple[str, list[dict], bool]:
    """Ambil konteks gabungan (vector store + web search jika perlu), daftar sumber, dan status grounded."""
    filter_meta: dict = {}
    dokumen_disebut = _vector_store_dao.cari_dokumen_disebut(pertanyaan)
    if dokumen_disebut:
        filter_meta["title"] = dokumen_disebut
    elif fakultas:
        filter_meta["fakultas"] = fakultas

    hasil_lokal = _vector_store_dao.similarity_search(
        pertanyaan, k=config.RETRIEVAL_K, filter_meta=filter_meta or None
    )

    if hasil_lokal:
        skor_tertinggi = _vector_store_dao.hitung_skor_cosine(pertanyaan, hasil_lokal)
        print(f"[rag_engine] Skor cosine similarity tertinggi (info saja): {skor_tertinggi:.3f}")

    potongan = [f"[Sumber: {r.metadata.get('title')}]\n{r.page_content}" for r in hasil_lokal]
    sumber = [
        {"title": r.metadata.get("title"), "source": r.metadata.get("source"), "asal": "vector_store"}
        for r in hasil_lokal
    ]

    konteks_lokal = "\n\n".join(potongan)
    konteks_cukup = bool(hasil_lokal) and _llm_service.cek_konteks_cukup(pertanyaan, konteks_lokal)
    print(f"[rag_engine] Konteks lokal cukup menjawab pertanyaan? {konteks_cukup}")

    if not konteks_cukup:
        hasil_web = _web_search_dao.cari_web_uho(pertanyaan)
        for w in hasil_web:
            potongan.append(f"[Web] [Sumber: {w['title']}]\n{w['content']}")
            sumber.append({"title": w["title"], "source": w["source"], "asal": "web_search"})

        konteks_gabungan = "\n\n".join(potongan)
        konteks_cukup = bool(hasil_web) and _llm_service.cek_konteks_cukup(pertanyaan, konteks_gabungan)
        print(f"[rag_engine] Konteks (lokal+web) cukup menjawab pertanyaan? {konteks_cukup}")

    return "\n\n".join(potongan), sumber, konteks_cukup
