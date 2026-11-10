"""Retrieval hybrid, sama dengan notebook v3: vektor (ChromaDB) + BM25 digabung RRF, lalu cross-encoder reranker."""

import re
import threading
from typing import Optional

import numpy as np

import config
import knowledge


def tokenisasi(t: str) -> list:
    return re.findall(r"\w+", t.lower())


class VectorStoreDAO:
    def __init__(self):
        self.vectorstore = None
        self.docs: list = []
        self.bm25 = None
        self.reranker = None
        self.manifest: dict = {}
        self.lock = threading.Lock()   # satu upload/aktivasi pada satu waktu

    def init_store(self) -> None:
        # Import berat ada di sini supaya modul ini (dan tes) bisa diimpor tanpa model terpasang.
        import chromadb
        import torch
        from chromadb.config import Settings
        from langchain_chroma import Chroma
        from langchain_core.documents import Document
        from langchain_huggingface import HuggingFaceEmbeddings
        from rank_bm25 import BM25Okapi
        from sentence_transformers import CrossEncoder
        from torch.nn import Sigmoid

        device = config.DEVICE or ("cuda" if torch.cuda.is_available() else "cpu")
        embeddings = HuggingFaceEmbeddings(
            model_name=config.EMBEDDING_MODEL,
            model_kwargs={"device": device},
            encode_kwargs={"normalize_embeddings": True},   # harus sama dengan saat index dibangun
        )
        client = chromadb.PersistentClient(
            path=config.CHROMA_DIR, settings=Settings(anonymized_telemetry=False, is_persistent=True)
        )
        # get_collection (bukan Chroma(...)) supaya koleksi yang salah nama GAGAL KERAS, bukan diam-diam dibuat kosong.
        try:
            jumlah = client.get_collection(config.COLLECTION_NAME).count()
        except Exception as e:
            raise RuntimeError(
                f"Koleksi '{config.COLLECTION_NAME}' tidak ditemukan di '{config.CHROMA_DIR}'. Salin folder index dari "
                f"notebook (chroma_db_akademik) dan samakan CHROMA_DIR / CHROMA_COLLECTION. ({e})"
            ) from e
        if jumlah == 0:
            raise RuntimeError(f"Koleksi '{config.COLLECTION_NAME}' kosong. Bangun ulang index di notebook (sel 5-6).")

        self.vectorstore = Chroma(client=client, collection_name=config.COLLECTION_NAME, embedding_function=embeddings)
        try:
            self.vectorstore.similarity_search("tes", k=1)
        except Exception as e:
            raise RuntimeError(
                f"Pencarian uji gagal -- EMBEDDING_MODEL ('{config.EMBEDDING_MODEL}') harus SAMA dengan yang dipakai "
                f"notebook saat membangun index (BAAI/bge-m3, normalize_embeddings=True). ({e})"
            ) from e

        got = self.vectorstore.get(include=["documents", "metadatas"])
        # Chunk lama (notebook) belum punya doc_id -> tandai "base" sekali, supaya bisa difilter per versi.
        lama = [(i, {**m, "doc_id": knowledge.BASE}) for i, m in zip(got["ids"], got["metadatas"]) if "doc_id" not in m]
        koleksi = client.get_collection(config.COLLECTION_NAME)
        for a in range(0, len(lama), 5000):
            koleksi.update(ids=[i for i, _ in lama[a:a + 5000]], metadatas=[m for _, m in lama[a:a + 5000]])
        got["metadatas"] = [{**m, "doc_id": m.get("doc_id", knowledge.BASE)} for m in got["metadatas"]]
        self.docs = [Document(page_content=t, metadata=m) for t, m in zip(got["documents"], got["metadatas"])]
        self.bm25 = BM25Okapi([tokenisasi(d.page_content) for d in self.docs])
        self.manifest = knowledge.muat()
        if lama or not self.manifest["dokumen"][knowledge.BASE]["chunks"]:
            self.manifest["dokumen"][knowledge.BASE]["chunks"] = sum(1 for d in self.docs if d.metadata["doc_id"] == knowledge.BASE)
        knowledge.simpan(self.manifest)
        self.reranker = CrossEncoder(config.RERANK_MODEL, max_length=512, device=device, activation_fn=Sigmoid())
        print(f"[vector_store] {jumlah} chunk | embedding {config.EMBEDDING_MODEL} | reranker {config.RERANK_MODEL} | device {device}")

    def retrieve(self, rerank_query: str, queries: list, fakultas: Optional[str] = None, versi: Optional[int] = None) -> list:
        """Top-N [(Document, skor 0-1)]. Kandidat = vektor + BM25 per query, digabung RRF, lalu di-rerank terhadap rerank_query.
        Kalau fakultas diisi: dokumen fakultas itu + dokumen tingkat UNIVERSITAS.
        Hanya dokumen milik versi pengetahuan `versi` (default: versi aktif) yang dipakai."""
        docs = knowledge.docs_versi(self.manifest, versi or self.manifest["aktif"]) if self.manifest else None
        syarat = ([{"fakultas": {"$in": [fakultas, "UNIVERSITAS"]}}] if fakultas else []) + ([{"doc_id": {"$in": docs}}] if docs else [])
        where = {"$and": syarat} if len(syarat) > 1 else (syarat[0] if syarat else None)
        ok = lambda m: (not fakultas or m.get("fakultas") in (fakultas, "UNIVERSITAS")) and (not docs or m.get("doc_id") in docs)
        rrf = {}
        for q in queries:
            dense = self.vectorstore.similarity_search(q, k=config.FETCH_K, filter=where)
            sk = self.bm25.get_scores(tokenisasi(q))
            sparse = [self.docs[i] for i in np.argsort(-sk) if sk[i] > 0 and ok(self.docs[i].metadata)][:config.FETCH_K]
            for daftar in (dense, sparse):
                for r, d in enumerate(daftar):
                    e = rrf.setdefault((d.metadata.get("doc_id"), d.metadata["source"], d.metadata["chunk_index"]), [d, 0.0])
                    e[1] += 1 / (60 + r)
        kandidat = [d for d, _ in sorted(rrf.values(), key=lambda e: -e[1])[:config.RERANK_CANDIDATES]]
        if not kandidat:
            return []
        # ponytail: tanpa batas konkurensi; di CPU, beberapa request bersamaan akan saling memperlambat (tambah semaphore kalau perlu)
        skor = np.asarray(self.reranker.predict([(rerank_query, d.page_content) for d in kandidat], show_progress_bar=False), dtype=float)
        urut = np.argsort(-skor)[:config.TOP_N]
        return [(kandidat[i], float(skor[i])) for i in urut]

    def tambah_pdf(self, data: bytes, title: str, fakultas: str, source: str, catatan: str,
                   ganti_doc_id: Optional[str] = None, aktifkan: bool = True) -> dict:
        """Index PDF baru lalu buat versi baru = docs versi aktif (+ PDF ini, - ganti_doc_id). Dipanggil di threadpool."""
        from langchain_core.documents import Document
        from rank_bm25 import BM25Okapi

        doc_id = knowledge.doc_id_baru()
        chunks = knowledge.chunk_pdf(data, title, fakultas, source, doc_id)
        with self.lock:
            m = self.manifest
            docs = [d for d in knowledge.docs_versi(m, m["aktif"]) if d != ganti_doc_id] + [doc_id]
            baru = [Document(page_content=t, metadata=md) for t, md in chunks]
            self.vectorstore.add_documents(baru, ids=[f"{doc_id}-{md['chunk_index']}" for _, md in chunks])
            # ponytail: BM25 dibangun ulang penuh tiap upload (detik untuk ~10rb chunk); inkremental kalau korpus jauh lebih besar
            semua = self.docs + baru
            bm25 = BM25Okapi([tokenisasi(d.page_content) for d in semua])
            self.docs = semua    # docs dulu, baru bm25: request yang sedang jalan tidak pernah dapat indeks di luar jangkauan
            self.bm25 = bm25
            m["dokumen"][doc_id] = {"title": title, "fakultas": fakultas, "source": source, "chunks": len(chunks),
                                    "dibuat": chunks[0][1]["ingested_at"]}
            no = knowledge.tambah_versi(m, docs, catatan or f"Tambah: {title}", aktifkan)
            knowledge.simpan(m)
        return {"doc_id": doc_id, "chunks": len(chunks), "versi": no, "aktif": m["aktif"]}

    def aktifkan(self, no: int) -> None:
        with self.lock:
            knowledge.docs_versi(self.manifest, no)   # KeyError kalau tidak ada
            self.manifest["aktif"] = no
            knowledge.simpan(self.manifest)
