"""Pengetahuan berversi: PDF upload admin -> chunk -> masuk Chroma; versi = daftar doc_id yang aktif.

Chunk tidak pernah dihapus dari Chroma, jadi pindah ke versi mana pun (maju/mundur) cukup ganti 'aktif'.
Manifest disimpan di CHROMA_DIR/versi.json:
  {"aktif": 2, "versi": [{"no": 1, "docs": ["base"], "catatan": "...", "dibuat": "..."}, ...],
   "dokumen": {"base": {"title": "Index notebook", ...}, "<doc_id>": {...}}}
"""

import datetime
import json
import os
import re
import uuid

import config

PATH = os.path.join(config.CHROMA_DIR, "versi.json")
BASE = "base"   # semua chunk hasil notebook


def muat() -> dict:
    if os.path.exists(PATH):
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    now = datetime.datetime.now().isoformat(timespec="seconds")
    return {"aktif": 1, "versi": [{"no": 1, "docs": [BASE], "catatan": "Index awal dari notebook", "dibuat": now}],
            "dokumen": {BASE: {"title": "Index awal dari notebook", "fakultas": "-", "chunks": 0, "dibuat": now}}}


def simpan(m: dict) -> None:
    tmp = PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(m, f, ensure_ascii=False, indent=2)
    os.replace(tmp, PATH)   # atomik: manifest tidak pernah setengah tertulis


def docs_versi(m: dict, no: int) -> list:
    for v in m["versi"]:
        if v["no"] == no:
            return v["docs"]
    raise KeyError(f"Versi {no} tidak ada")


def tambah_versi(m: dict, docs: list, catatan: str, aktifkan: bool) -> int:
    no = max(v["no"] for v in m["versi"]) + 1
    m["versi"].append({"no": no, "docs": docs, "catatan": catatan,
                       "dibuat": datetime.datetime.now().isoformat(timespec="seconds")})
    if aktifkan:
        m["aktif"] = no
    return no


RE_BAB = re.compile(r"\bBAB\s+([IVXLC]+)\b")
RE_PASAL = re.compile(r"\bPasal\s*(\d+)\b")


def _terakhir(rx, teks: str) -> str:
    hit = rx.findall(teks)
    return hit[-1] if hit else ""


def chunk_pdf(data: bytes, title: str, fakultas: str, source: str, doc_id: str) -> list:
    """PDF -> [(teks, metadata)] dengan format sama seperti index notebook v3 (header [judul | BAB | Pasal | hal.])."""
    import pymupdf as fitz
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    with fitz.open(stream=data, filetype="pdf") as pdf:
        halaman = [p.get_text() for p in pdf]
    awal, pos = [], 0               # offset karakter awal tiap halaman di teks gabungan
    for h in halaman:
        awal.append(pos)
        pos += len(h) + 1
    teks = "\n".join(halaman)
    if len(teks.strip()) < 50:
        raise ValueError("PDF tidak berisi teks yang bisa dibaca (kemungkinan hasil scan, perlu OCR dulu).")

    hal_di = lambda off: sum(1 for a in awal if a <= off)   # nomor halaman 1-based
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150, add_start_index=True,
                                              separators=["\nBAB ", "\nPasal ", "\n\n", "\n", ". ", " ", ""])
    hari = datetime.date.today().isoformat()
    out = []
    for i, d in enumerate(splitter.create_documents([teks])):
        s = d.metadata["start_index"]
        konteks = teks[:s + 100]    # ponytail: BAB/Pasal = penyebutan terakhir s.d. awal chunk (heuristik, sama seperti header notebook)
        bab, pasal = _terakhir(RE_BAB, konteks), _terakhir(RE_PASAL, konteks)
        h, z = hal_di(s), hal_di(s + len(d.page_content) - 1)
        header = " | ".join([title] + ([f"BAB {bab}"] if bab else []) + ([f"Pasal {pasal}"] if pasal else []) + [f"hal. {h}"])
        out.append((f"[{header}]\n{d.page_content}", {
            "source": source, "title": title, "jenis": "pdf", "fakultas": fakultas, "bab": bab, "pasal": pasal,
            "halaman": h, "halaman_akhir": z, "chunk_index": i, "ingested_at": hari, "doc_id": doc_id,
        }))
    return out


def doc_id_baru() -> str:
    return uuid.uuid4().hex[:12]
