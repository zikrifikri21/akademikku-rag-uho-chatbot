"""Orkestrasi RAG (sama dengan jawab_pertanyaan di notebook v3): retrieve -> ambang skor -> LLM JSON -> sitasi tervalidasi."""

import re
from typing import Optional

import config
import llm
from vector_store import VectorStoreDAO

store = VectorStoreDAO()


def init_engine() -> None:
    if not config.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY kosong. Isi di .env.")
    if not config.INTERNAL_API_KEY:
        print("[rag_engine] PERINGATAN: INTERNAL_API_KEY kosong -> endpoint terbuka untuk siapa pun yang tahu URL-nya.")
    store.init_store()


def sumber_str(m: dict) -> str:
    h, z = m.get("halaman") or 0, m.get("halaman_akhir") or 0
    hal = f"hal. {h}" + (f"–{z}" if z > h else "") + " (halaman PDF)" if h else ""
    bagian = [m.get("title") or "Dokumen"] + ([f"Pasal {m['pasal']}"] if m.get("pasal") else []) + ([hal] if hal else [])
    src = m.get("source") or ""
    return ", ".join(bagian) + (f" — {src}" if src.startswith("http") else "")   # path lokal tidak pernah ditampilkan


def _sumber_item(m: dict) -> dict:
    src = m.get("source") or ""
    return {
        "title": m.get("title"), "source": src if src.startswith("http") else None, "asal": "vector_store",
        "pasal": m.get("pasal") or None, "halaman": m.get("halaman") or None, "halaman_akhir": m.get("halaman_akhir") or None,
    }


def jawab(pertanyaan: str, riwayat: list, fakultas: Optional[str] = None, model: Optional[str] = None) -> tuple:
    """(teks, sumber). Kalau tidak ada jawaban yang didukung dokumen: (TIDAK_ADA, [])."""
    standalone = llm.tulis_ulang(pertanyaan, riwayat, model)
    queries = [pertanyaan] + ([standalone] if standalone != pertanyaan else [])
    rerank_q = standalone if riwayat else pertanyaan      # pertanyaan lanjutan ("terus gimana?") baru bermakna setelah ditulis ulang
    hasil = [(d, s) for d, s in store.retrieve(rerank_q, queries, fakultas) if s >= config.MIN_RERANK_SCORE]
    print(f"[rag_engine] query={standalone!r} | skor tertinggi={hasil[0][1] if hasil else 0:.2f} | konteks={len(hasil)}")
    if not hasil:
        return config.TIDAK_ADA, []          # LLM tidak dipanggil -> tidak ada peluang berhalusinasi

    konteks = "\n\n".join(f"[{i}] {d.page_content}" for i, (d, _) in enumerate(hasil, 1))
    riwayat_teks = "\n".join(f"{m['role']}: {m['content']}" for m in riwayat[-4:])
    pesan = [
        ("system", config.SYSTEM_PROMPT),
        ("human", (f"<riwayat>\n{riwayat_teks}\n</riwayat>\n\n" if riwayat_teks else "")
                  + f"<konteks>\n{konteks}\n</konteks>\n\nPertanyaan mahasiswa: {pertanyaan}"),
    ]
    out = llm.tanya_json(pesan, model)
    if not out:
        return config.TIDAK_ADA, []
    jawaban = str(out.get("jawaban") or "").strip()
    # sumber = yang dilaporkan LLM + nomor [n] di jawabannya, hanya yang valid
    nomor = [str(n) for n in (out.get("sumber") or [])] + re.findall(r"\[(\d+)\]", jawaban)
    valid = sorted({int(n) for n in nomor if n.isdigit() and 1 <= int(n) <= len(hasil)})
    if out.get("ditemukan") is not True or not jawaban or not valid:
        return config.TIDAK_ADA, []          # tanpa sitasi yang valid, jawaban tidak ditampilkan
    metas = [hasil[n - 1][0].metadata for n in valid]
    teks = f"{jawaban}\n\nSumber:\n" + "\n".join(f"[{n}] {sumber_str(m)}" for n, m in zip(valid, metas))
    return teks, [_sumber_item(m) for m in metas]
