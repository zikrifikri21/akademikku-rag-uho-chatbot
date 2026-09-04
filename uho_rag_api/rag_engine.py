"""
Modul inti RAG: vector store (ChromaDB hasil scraping+PDF dari notebook Colab)
digabung web search live (Tavily) sebagai fallback ketika dokumen resmi
belum cukup relevan.

Dipanggil dari main.py -- init_engine() dijalankan sekali saat FastAPI startup.
"""

import math
import os
from typing import Optional
from urllib.parse import urlparse

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from tavily import TavilyClient

CHROMA_DIR = os.environ.get("CHROMA_DIR", "./chroma_db_uho")
COLLECTION_NAME = os.environ.get("CHROMA_COLLECTION", "uho_knowledge_base")
EMBEDDING_MODEL = os.environ.get(
    "EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
DEFAULT_MODEL = os.environ.get("DEFAULT_GROQ_MODEL", "openai/gpt-oss-20b")
AMBANG_SKOR_RELEVANSI = float(os.environ.get("AMBANG_SKOR_RELEVANSI", "0.35"))
RETRIEVAL_K = int(os.environ.get("RETRIEVAL_K", "8"))

SYSTEM_PROMPT = (
    "Kamu adalah asisten informasi resmi kampus Universitas Halu Oleo (UHO). "
    "Konteks yang TIDAK ditandai '[Web]' adalah dokumen resmi kampus yang sudah dikurasi -- "
    "ini sumber utama dan paling terpercaya, utamakan selalu jawaban dari sini. "
    "Konteks yang ditandai '[Web]' hanyalah referensi tambahan dari pencarian internet; "
    "JANGAN biarkan info dari '[Web]' menggantikan, mengubah, atau bertentangan dengan info "
    "dari dokumen resmi yang sudah ada. "
    "Kalau kamu memang perlu memakai info dari '[Web]' karena dokumen resmi belum membahas "
    "pertanyaannya, sampaikan itu dengan kalimatmu sendiri secara natural sebagai referensi "
    "tambahan (variasikan redaksinya sesuai konteks jawaban, jangan pakai kalimat baku yang "
    "sama persis setiap kali). "
    "Jika konteks (baik dokumen resmi maupun web) sama sekali tidak menjawab pertanyaan, "
    "katakan dengan jujur bahwa informasi tidak tersedia dan sarankan menghubungi bagian "
    "akademik terkait. Jangan mengarang informasi."
)

# State modul-level, diisi sekali oleh init_engine() saat startup FastAPI
_embedding_model = None
_vectorstore: Optional[Chroma] = None
_document_titles: list[str] = []
_domain_terverifikasi: list[str] = []
_tavily_client: Optional[TavilyClient] = None


def init_engine() -> None:
    """Muat embedding model + vector store + client Tavily. Dipanggil sekali di lifespan FastAPI."""
    global _embedding_model, _vectorstore, _document_titles, _domain_terverifikasi, _tavily_client

    _embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    _vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=_embedding_model,
        collection_name=COLLECTION_NAME,
    )

    raw = _vectorstore.get(include=["metadatas"])
    metadatas = raw.get("metadatas", [])
    _document_titles = list({m.get("title") for m in metadatas if m.get("title")})

    # Domain yang boleh dipakai web search fallback = domain yang benar-benar sudah berhasil
    # di-scrape dan tersimpan di vector store -- bukan menebak lewat trik 'site:' di query,
    # yang tidak menjamin cakupan subdomain (fmipa.uho.ac.id, bastra.uho.ac.id, dst).
    _domain_terverifikasi = list({
        urlparse(m["source"]).netloc
        for m in metadatas
        if m.get("source", "").startswith("http")
    })

    tavily_key = os.environ.get("TAVILY_API_KEY")
    _tavily_client = TavilyClient(api_key=tavily_key) if tavily_key else None

    print(f"[rag_engine] Vector store dimuat: {len(_document_titles)} dokumen unik.")
    print(f"[rag_engine] Domain terverifikasi untuk web search: {_domain_terverifikasi}")
    print(f"[rag_engine] Web search fallback: {'aktif' if _tavily_client else 'nonaktif (TAVILY_API_KEY kosong)'}")

    if not os.environ.get("GROQ_API_KEY"):
        raise RuntimeError(
            "GROQ_API_KEY kosong/tidak ditemukan. Pastikan file '.env' (bukan '.env.example') "
            "ada di folder yang sama dengan main.py dan berisi GROQ_API_KEY=<key asli>."
        )
    print("[rag_engine] GROQ_API_KEY terdeteksi.")


def cari_dokumen_disebut(pertanyaan: str, threshold: float = 0.3) -> Optional[str]:
    """Deteksi apakah pertanyaan menyebut judul dokumen tertentu, supaya pencarian
    bisa difokuskan ke dokumen itu saja."""
    pertanyaan_lower = pertanyaan.lower()
    best_title, best_score = None, 0.0
    for title in _document_titles:
        kata_judul = set(title.lower().replace("-", " ").replace("_", " ").split())
        overlap = sum(1 for w in kata_judul if len(w) > 3 and w in pertanyaan_lower)
        score = overlap / max(len(kata_judul), 1)
        if score > best_score:
            best_score, best_title = score, title
    return best_title if best_score >= threshold else None


def cari_web_uho(pertanyaan: str, max_results: int = 3) -> list[dict]:
    """Fallback web search live, dibatasi HANYA ke domain yang sudah terbukti berhasil
    di-scrape sebelumnya (tersimpan di vector store) -- bukan menebak lewat trik 'site:'."""
    if _tavily_client is None:
        return []
    try:
        hasil = _tavily_client.search(
            query=pertanyaan,
            include_domains=_domain_terverifikasi or ["uho.ac.id"],
            max_results=max_results,
        )
    except Exception as e:
        print(f"[rag_engine] Web search gagal: {e}")
        return []
    return [
        {"title": r.get("title", r["url"]), "source": r["url"], "content": r.get("content", "")}
        for r in hasil.get("results", [])
    ]


def _cosine_sim(a: list, b: list) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _cek_konteks_cukup(pertanyaan: str, konteks: str) -> bool:
    """Tanya ke LLM apakah konteks ini BENAR-BENAR berisi jawaban spesifik untuk
    pertanyaan -- ini lebih akurat daripada threshold cosine similarity, karena
    similarity cuma mengukur kemiripan topik (mis. sama-sama menyebut 'Rektor'),
    bukan apakah jawabannya (mis. nama rektornya) benar-benar ada di teks itu."""
    if not konteks.strip():
        return False
    prompt = (
        f"Konteks:\n{konteks}\n\n"
        f"Pertanyaan: {pertanyaan}\n\n"
        "Apakah konteks di atas secara EKSPLISIT berisi jawaban untuk pertanyaan ini "
        "(bukan cuma topiknya mirip/berkaitan)? Jawab HANYA dengan satu kata: YA atau TIDAK."
    )
    try:
        respons = get_llm().invoke([("human", prompt)])
        return respons.content.strip().upper().startswith("YA")
    except Exception as e:
        print(f"[rag_engine] Cek kecukupan konteks gagal, anggap tidak cukup: {e}")
        return False


def ambil_konteks(pertanyaan: str, fakultas: Optional[str] = None) -> tuple[str, list[dict]]:
    """Ambil konteks gabungan (vector store + web search kalau perlu) dan daftar sumbernya.

    Prioritas filter metadata: nama dokumen yang disebut eksplisit di pertanyaan > fakultas
    (kalau dikirim dari frontend, mis. user login sebagai mahasiswa FMIPA) > tanpa filter.

    Keputusan fallback ke web TIDAK lagi memakai threshold cosine similarity -- skor itu
    cuma mengukur kemiripan topik, bisa tinggi meski chunk-nya tidak benar-benar menjawab
    pertanyaan (lihat _cek_konteks_cukup). Skor cosine di bawah tetap dihitung untuk log
    debug saja.
    """
    filter_meta: dict = {}
    dokumen_disebut = cari_dokumen_disebut(pertanyaan)
    if dokumen_disebut:
        filter_meta["title"] = dokumen_disebut
    elif fakultas:
        filter_meta["fakultas"] = fakultas

    hasil_lokal = _vectorstore.similarity_search(
        pertanyaan, k=RETRIEVAL_K, filter=filter_meta or None
    )

    if hasil_lokal:
        query_vec = _embedding_model.embed_query(pertanyaan)
        doc_vecs = _embedding_model.embed_documents([r.page_content for r in hasil_lokal])
        skor_tertinggi = max(_cosine_sim(query_vec, dv) for dv in doc_vecs)
        print(f"[rag_engine] Skor cosine similarity tertinggi (info saja, bukan penentu): {skor_tertinggi:.3f}")

    potongan = [f"[Sumber: {r.metadata.get('title')}]\n{r.page_content}" for r in hasil_lokal]
    sumber = [
        {"title": r.metadata.get("title"), "source": r.metadata.get("source"), "asal": "vector_store"}
        for r in hasil_lokal
    ]

    konteks_lokal = "\n\n".join(potongan)
    konteks_cukup = bool(hasil_lokal) and _cek_konteks_cukup(pertanyaan, konteks_lokal)
    print(f"[rag_engine] Konteks lokal cukup menjawab pertanyaan? {konteks_cukup}")

    if not konteks_cukup:
        for w in cari_web_uho(pertanyaan):
            potongan.append(f"[Web] [Sumber: {w['title']}]\n{w['content']}")
            sumber.append({"title": w["title"], "source": w["source"], "asal": "web_search"})

    return "\n\n".join(potongan), sumber


def get_llm(model: Optional[str] = None) -> ChatGroq:
    return ChatGroq(model=model or DEFAULT_MODEL, temperature=0.2, streaming=True)