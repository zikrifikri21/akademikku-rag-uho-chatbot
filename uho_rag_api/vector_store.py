"""
Modul DAO (Data Access Object) Vector Store: Mengelola ChromaDB, HuggingFace embeddings,
serta metadata dokumen kampus UHO.
"""

import math
from typing import Optional
from urllib.parse import urlparse

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

import chromadb
from chromadb.config import Settings

import config


class VectorStoreDAO:
    def __init__(self):
        self.embedding_model = None
        self.vectorstore: Optional[Chroma] = None
        self.document_titles: list[str] = []
        self.domain_terverifikasi: list[str] = []

    def init_store(self) -> None:
        """Inisialisasi embedding model & ChromaDB vector store."""
        self.embedding_model = HuggingFaceEmbeddings(model_name=config.EMBEDDING_MODEL)
        
        chroma_client = chromadb.PersistentClient(
            path=config.CHROMA_DIR,
            settings=Settings(anonymized_telemetry=False, is_persistent=True)
        )
        self.vectorstore = Chroma(
            client=chroma_client,
            embedding_function=self.embedding_model,
            collection_name=config.COLLECTION_NAME,
        )

        raw = self.vectorstore.get(include=["metadatas"])
        metadatas = raw.get("metadatas", [])
        self.document_titles = list({m.get("title") for m in metadatas if m.get("title")})
        self.domain_terverifikasi = list({
            urlparse(m["source"]).netloc
            for m in metadatas
            if m.get("source", "").startswith("http")
        })

    def similarity_search(self, pertanyaan: str, k: int = config.RETRIEVAL_K, filter_meta: Optional[dict] = None) -> list:
        if self.vectorstore is None:
            return []
        return self.vectorstore.similarity_search(
            pertanyaan, k=k, filter=filter_meta or None
        )

    def cari_dokumen_disebut(self, pertanyaan: str, threshold: float = config.DOCUMENT_MATCH_THRESHOLD) -> Optional[str]:
        pertanyaan_lower = pertanyaan.lower()
        best_title, best_score = None, 0.0
        for title in self.document_titles:
            kata_judul = set(title.lower().replace("-", " ").replace("_", " ").split())
            overlap = sum(1 for w in kata_judul if len(w) > 3 and w in pertanyaan_lower)
            score = overlap / max(len(kata_judul), 1)
            if score > best_score:
                best_score, best_title = score, title
        return best_title if best_score >= threshold else None

    def hitung_skor_cosine(self, pertanyaan: str, hasil_lokal: list) -> float:
        if not hasil_lokal or not self.embedding_model:
            return 0.0
        query_vec = self.embedding_model.embed_query(pertanyaan)
        doc_vecs = self.embedding_model.embed_documents([r.page_content for r in hasil_lokal])
        return max(self._cosine_sim(query_vec, dv) for dv in doc_vecs)

    @staticmethod
    def _cosine_sim(a: list, b: list) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
