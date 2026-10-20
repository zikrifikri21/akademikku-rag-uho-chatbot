"""Tes cepat tanpa model dan tanpa Groq:  pip install httpx rank-bm25 && python test_smoke.py"""
import json

import numpy as np
from fastapi.testclient import TestClient
from langchain_core.documents import Document
from rank_bm25 import BM25Okapi

import config
import llm
import main
import rag_engine
from vector_store import VectorStoreDAO, tokenisasi


def meta(**k):
    base = dict(source="/drive/x.pdf", title="Perrek 1/2019", jenis="pdf", fakultas="UNIVERSITAS", bab="", pasal="", halaman=0, halaman_akhir=0, chunk_index=0)
    base.update(k)
    return base


DOCS = [
    Document(page_content="[Perrek 1/2019 | Pasal 96 | hal. 69]\nCuti akademik sarjana maksimal 3 semester tidak berturutan.",
             metadata=meta(pasal="96", halaman=69, halaman_akhir=70, source="https://uho.ac.id/perrek.pdf")),
    Document(page_content="[Panduan FT | hal. 3]\nCuti khusus fakultas teknik diatur terpisah.",
             metadata=meta(title="Panduan FT", fakultas="FT", halaman=3, halaman_akhir=3, chunk_index=1)),
    Document(page_content="[Wisuda]\nWisuda dilaksanakan empat kali setahun.", metadata=meta(title="Wisuda", jenis="web", chunk_index=2)),
]


class FakeVS:
    filters = []

    def similarity_search(self, q, k=15, filter=None):
        FakeVS.filters.append(filter)
        ok = (lambda d: d.metadata["fakultas"] in filter["fakultas"]["$in"]) if filter else (lambda d: True)
        return [d for d in DOCS if ok(d)][:k]


class FakeRerank:
    def predict(self, pairs, show_progress_bar=False):
        return [0.9 if ("cuti" in q.lower() and "cuti" in d.lower()) else 0.05 for q, d in pairs]


def pasang_store():
    s = rag_engine.store
    s.vectorstore, s.docs, s.reranker = FakeVS(), DOCS, FakeRerank()
    s.bm25 = BM25Okapi([tokenisasi(d.page_content) for d in DOCS])


def pasang_llm(resp):
    llm.tulis_ulang = lambda p, r, m=None: "cuti akademik"
    llm.tanya_json = lambda pesan, m=None: resp if not callable(resp) else resp(pesan)


def tes_config_sama_dengan_notebook():
    assert (config.EMBEDDING_MODEL, config.COLLECTION_NAME, config.RERANK_MODEL) == ("BAAI/bge-m3", "akademik_uho", "BAAI/bge-reranker-v2-m3")
    assert (config.FETCH_K, config.TOP_N, config.MIN_RERANK_SCORE) == (15, 5, 0.2)
    assert config.TIDAK_ADA.startswith("Maaf, saya tidak menemukan informasi itu di dokumen akademik resmi UHO")


def tes_filter_fakultas_termasuk_universitas():
    pasang_store()
    FakeVS.filters.clear()
    hasil = rag_engine.store.retrieve("cuti", ["cuti"], "FMIPA")
    assert FakeVS.filters[-1] == {"fakultas": {"$in": ["FMIPA", "UNIVERSITAS"]}}
    assert {d.metadata["fakultas"] for d, _ in hasil} == {"UNIVERSITAS"}       # FT tidak ikut, UNIVERSITAS ikut
    assert {d.metadata["fakultas"] for d, _ in rag_engine.store.retrieve("cuti", ["cuti"], "FT")} == {"FT", "UNIVERSITAS"}


def tes_jawaban_bersitasi():
    pasang_store()
    pasang_llm({"ditemukan": True, "jawaban": "Tergantung jenjang. Sarjana maksimal 3 semester [1].", "sumber": [1]})
    teks, sumber = rag_engine.jawab("bisa cuti lagi kalau sudah 2x?", [])
    assert "Sumber:\n[1] Perrek 1/2019, Pasal 96, hal. 69–70 (halaman PDF) — https://uho.ac.id/perrek.pdf" in teks
    assert sumber == [{"title": "Perrek 1/2019", "source": "https://uho.ac.id/perrek.pdf", "asal": "vector_store", "pasal": "96", "halaman": 69, "halaman_akhir": 70}]


def tes_penolakan():
    pasang_store()
    TA = config.TIDAK_ADA
    pasang_llm({"ditemukan": False, "jawaban": "Maaf tidak ada", "sumber": []})
    assert rag_engine.jawab("cuti?", []) == (TA, [])                           # LLM menolak -> kalimat baku, tanpa sumber
    pasang_llm({"ditemukan": True, "jawaban": "Bisa.", "sumber": []})
    assert rag_engine.jawab("cuti?", []) == (TA, [])                           # tanpa sitasi valid
    pasang_llm({"ditemukan": True, "jawaban": "Bisa [9].", "sumber": [9]})
    assert rag_engine.jawab("cuti?", []) == (TA, [])                           # nomor di luar jangkauan
    pasang_llm(None)
    assert rag_engine.jawab("cuti?", []) == (TA, [])                           # JSON rusak
    dipanggil = []
    pasang_llm(lambda pesan: dipanggil.append(1))
    assert rag_engine.jawab("siapa juara piala dunia?", []) == (TA, []) and not dipanggil   # skor rendah -> LLM tidak dipanggil


def tes_json_dan_sumber_str():
    assert llm.urai_json('```json\n{"ditemukan": false}\n```') == {"ditemukan": False} and llm.urai_json("bukan json") is None
    assert "/drive/" not in rag_engine.sumber_str(meta(pasal="1", halaman=5, halaman_akhir=5))     # path lokal tidak bocor
    assert llm.pilih_model("claude-3-opus") == config.DEFAULT_MODEL and llm.pilih_model("openai/gpt-oss-120b") == "openai/gpt-oss-120b"


def tes_endpoint():
    main.init_engine = lambda: None
    config.INTERNAL_API_KEY = "rahasia"
    isi = {"message": "cuti?", "history": [{"role": "user", "content": "halo"}]}
    with TestClient(main.app) as c:
        assert c.post("/api/rag/stream", json=isi).status_code == 401
        assert c.post("/api/rag/stream", json=isi, headers={"X-Internal-Api-Key": "salah"}).status_code == 401
        assert c.post("/api/rag/stream", json={"message": "x", "history": [{"role": "system", "content": "x"}]}, headers={"X-Internal-Api-Key": "rahasia"}).status_code == 422
        h = {"X-Internal-Api-Key": "rahasia"}

        main.jawab = lambda *a, **k: ("Bisa [1].\n\nSumber:\n[1] Perrek, Pasal 96", [{"title": "Perrek", "source": None, "asal": "vector_store"}])
        ev = [json.loads(l) for l in c.post("/api/rag/stream", json=isi, headers=h).text.splitlines()]
        assert "".join(e["content"] for e in ev if e["eventType"] == "text_delta") == "Bisa [1].\n\nSumber:\n[1] Perrek, Pasal 96"
        assert ev[-1]["eventType"] == "sources"

        main.jawab = lambda *a, **k: (config.TIDAK_ADA, [])
        ev = [json.loads(l) for l in c.post("/api/rag/stream", json=isi, headers=h).text.splitlines()]
        assert "".join(e["content"] for e in ev) == config.TIDAK_ADA and all(e["eventType"] == "text_delta" for e in ev)

        def meledak(*a, **k): raise RuntimeError("GROQ_API_KEY=gsk_rahasia")
        main.jawab = meledak
        ev = [json.loads(l) for l in c.post("/api/rag/stream", json=isi, headers=h).text.splitlines()]
        assert ev == [{"eventType": "error", "content": "Terjadi kesalahan pada layanan. Silakan coba lagi."}]   # detail tidak bocor


if __name__ == "__main__":
    for nama, fn in list(globals().items()):
        if nama.startswith("tes_"):
            fn()
            print("lulus:", nama)
