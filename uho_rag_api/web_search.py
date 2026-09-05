"""
Modul DAO Web Search: Mengelola integrasi Tavily Web Search live fallback
dan validasi keamanan domain kampus UHO.
"""

import os
from typing import Optional
from urllib.parse import urlparse

from tavily import TavilyClient

import config


class WebSearchDAO:
    def __init__(self):
        self.tavily_client: Optional[TavilyClient] = None
        self.domain_terverifikasi: list[str] = []

    def init_search(self, domain_terverifikasi: list[str]) -> None:
        self.domain_terverifikasi = domain_terverifikasi
        tavily_key = os.environ.get("TAVILY_API_KEY")
        self.tavily_client = TavilyClient(api_key=tavily_key) if tavily_key else None

    def cari_web_uho(self, pertanyaan: str, max_results: int = config.WEB_SEARCH_MAX_RESULTS) -> list[dict]:
        if self.tavily_client is None:
            return []

        domain_valid = self.domain_terverifikasi or ["uho.ac.id"]
        try:
            hasil = self.tavily_client.search(
                query=pertanyaan,
                include_domains=domain_valid,
                max_results=max_results,
                search_depth="advanced",
            )
        except Exception as e:
            print(f"[web_search] Web search gagal: {e}")
            return []

        hasil_valid = []
        for r in hasil.get("results", []):
            netloc = urlparse(r["url"]).netloc
            if not any(netloc == d or netloc.endswith("." + d) for d in domain_valid):
                print(f"[web_search] Buang hasil web di luar domain terverifikasi: {r['url']}")
                continue
            hasil_valid.append(r)

        return [
            {"title": r.get("title", r["url"]), "source": r["url"], "content": r.get("content", "")}
            for r in hasil_valid
        ]
