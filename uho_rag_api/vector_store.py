"""Retrieval hybrid, sama dengan notebook v3: vektor (ChromaDB) + BM25 digabung RRF, lalu cross-encoder reranker."""

import re
from typing import Optional

import numpy as np

import config


def tokenisasi(t: str) -> list:
    return re.findall(r"\w+", t.lower())


class VectorStoreDAO:
    def __init__(self):
        self.vectorstore = None
        self.docs: list = []
        self.bm25 = None
        self.reranker = None

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
        self.docs = [Document(page_content=t, metadata=m) for t, m in zip(got["documents"], got["metadatas"])]
        self.bm25 = BM25Okapi([tokenisasi(d.page_content) for d in self.docs])
        self.reranker = CrossEncoder(config.RERANK_MODEL, max_length=512, device=device, activation_fn=Sigmoid())
        print(f"[vector_store] {jumlah} chunk | embedding {config.EMBEDDING_MODEL} | reranker {config.RERANK_MODEL} | device {device}")

    def retrieve(self, rerank_query: str, queries: list, fakultas: Optional[str] = None) -> list:
        """Top-N [(Document, skor 0-1)]. Kandidat = vektor + BM25 per query, digabung RRF, lalu di-rerank terhadap rerank_query.
        Kalau fakultas diisi: dokumen fakultas itu + dokumen tingkat UNIVERSITAS."""
        where = {"fakultas": {"$in": [fakultas, "UNIVERSITAS"]}} if fakultas else None
        ok = lambda m: not fakultas or m.get("fakultas") in (fakultas, "UNIVERSITAS")
        rrf = {}
        for q in queries:
            dense = self.vectorstore.similarity_search(q, k=config.FETCH_K, filter=where)
            sk = self.bm25.get_scores(tokenisasi(q))
            sparse = [self.docs[i] for i in np.argsort(-sk) if sk[i] > 0 and ok(self.docs[i].metadata)][:config.FETCH_K]
            for daftar in (dense, sparse):
                for r, d in enumerate(daftar):
                    e = rrf.setdefault((d.metadata["source"], d.metadata["chunk_index"]), [d, 0.0])
                    e[1] += 1 / (60 + r)
        kandidat = [d for d, _ in sorted(rrf.values(), key=lambda e: -e[1])[:config.RERANK_CANDIDATES]]
        if not kandidat:
            return []
        # ponytail: tanpa batas konkurensi; di CPU, beberapa request bersamaan akan saling memperlambat (tambah semaphore kalau perlu)
        skor = np.asarray(self.reranker.predict([(rerank_query, d.page_content) for d in kandidat], show_progress_bar=False), dtype=float)
        urut = np.argsort(-skor)[:config.TOP_N]
        return [(kandidat[i], float(skor[i])) for i in urut]
