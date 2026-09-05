"""
Modul Layanan LLM: Mengelola koneksi multi-provider LLM (Groq, OpenAI, Claude/Anthropic, Google Gemini),
kontekstualisasi pertanyaan follow-up, dan verifikasi kecukupan konteks RAG.
"""

from typing import Optional
from langchain_core.language_models.chat_models import BaseChatModel

import config


class LLMService:
    @staticmethod
    def get_llm(model: Optional[str] = None) -> BaseChatModel:
        """Pabrik LLM dinamis berdasarkan model & provider yang diminta.

        Mendukung Provider:
        - Groq (default): model 'openai/gpt-oss-20b', 'qwen/...', 'groq/...', atau default
        - OpenAI: model 'openai/gpt-4o', 'gpt-4o-mini', 'gpt-4...', 'gpt-3.5...'
        - Anthropic / Claude: model 'claude...', 'anthropic/claude...'
        - Google Gemini: model 'gemini...', 'google/gemini...'
        """
        model_name = (model or config.DEFAULT_MODEL).strip()
        model_lower = model_name.lower()

        # 1. Anthropic / Claude
        if model_lower.startswith("claude") or model_lower.startswith("anthropic/"):
            clean_model = model_name.split("anthropic/", 1)[-1]
            api_key = config.ANTHROPIC_API_KEY
            if not api_key:
                raise ValueError(
                    "ANTHROPIC_API_KEY (atau CLAUDE_API_KEY) tidak ditemukan di environment variables. "
                    "Silakan atur ANTHROPIC_API_KEY=<key_anda> di file .env."
                )
            try:
                from langchain_anthropic import ChatAnthropic
                return ChatAnthropic(
                    model=clean_model,
                    api_key=api_key,
                    temperature=0.2,
                    streaming=True,
                )
            except ImportError:
                raise ImportError(
                    "Package 'langchain-anthropic' belum terinstall. "
                    "Jalankan 'pip install langchain-anthropic' untuk menggunakan model Claude."
                )

        # 2. Native OpenAI (mis. gpt-4o, gpt-4o-mini, gpt-3.5 -- bukan openai/gpt-oss yang merupakan model Groq)
        if (
            (model_lower.startswith("openai/") and "gpt-oss" not in model_lower)
            or model_lower.startswith("gpt-4")
            or model_lower.startswith("gpt-3")
        ):
            clean_model = model_name.split("openai/", 1)[-1]
            api_key = config.OPENAI_API_KEY
            if not api_key:
                raise ValueError(
                    "OPENAI_API_KEY tidak ditemukan di environment variables. "
                    "Silakan atur OPENAI_API_KEY=<key_anda> di file .env."
                )
            try:
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(
                    model=clean_model,
                    api_key=api_key,
                    temperature=0.2,
                    streaming=True,
                )
            except ImportError:
                raise ImportError(
                    "Package 'langchain-openai' belum terinstall. "
                    "Jalankan 'pip install langchain-openai' untuk menggunakan model OpenAI."
                )

        # 3. Google Gemini
        if model_lower.startswith("gemini") or model_lower.startswith("google/"):
            clean_model = model_name.split("google/", 1)[-1]
            api_key = config.GOOGLE_API_KEY
            if not api_key:
                raise ValueError(
                    "GOOGLE_API_KEY (atau GEMINI_API_KEY) tidak ditemukan di environment variables. "
                    "Silakan atur GOOGLE_API_KEY=<key_anda> di file .env."
                )
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=clean_model,
                    google_api_key=api_key,
                    temperature=0.2,
                    streaming=True,
                )
            except ImportError:
                raise ImportError(
                    "Package 'langchain-google-genai' belum terinstall. "
                    "Jalankan 'pip install langchain-google-genai' untuk menggunakan model Gemini."
                )

        # 4. Default Provider: Groq (mis. 'openai/gpt-oss-20b', 'qwen/...', 'groq/...', dst)
        clean_model = model_name.split("groq/", 1)[-1]
        api_key = config.GROQ_API_KEY
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY tidak ditemukan di environment variables. "
                "Silakan atur GROQ_API_KEY=<key_anda> di file .env."
            )
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=clean_model,
            api_key=api_key,
            temperature=0.2,
            streaming=True,
            reasoning_format="hidden",
        )

    def kontekstualisasi_pertanyaan(self, pertanyaan: str, riwayat: list[dict], model: Optional[str] = None) -> str:
        """Tulis ulang pertanyaan follow-up jadi query pencarian standalone."""
        if not riwayat:
            return pertanyaan

        riwayat_teks = "\n".join(f"{m['role']}: {m['content']}" for m in riwayat[-4:])
        prompt = config.CONTEXTUALIZE_PROMPT_TEMPLATE.format(
            riwayat_teks=riwayat_teks, pertanyaan=pertanyaan
        )

        try:
            respons = self.get_llm(model).invoke([("human", prompt)])
            hasil = respons.content.strip().strip('"')
            return hasil or pertanyaan
        except Exception as e:
            print(f"[llm_service] Kontekstualisasi pertanyaan gagal, pakai pertanyaan asli: {e}")
            return pertanyaan

    def cek_konteks_cukup(self, pertanyaan: str, konteks: str, model: Optional[str] = None) -> bool:
        """Verifikasi eksplisit apakah konteks berisi jawaban spesifik."""
        if not konteks.strip():
            return False

        prompt = config.SUFFICIENCY_CHECK_PROMPT_TEMPLATE.format(
            konteks=konteks, pertanyaan=pertanyaan
        )

        try:
            respons = self.get_llm(model).invoke([("human", prompt)])
            return respons.content.strip().upper().startswith("YA")
        except Exception as e:
            print(f"[llm_service] Cek kecukupan konteks gagal, anggap tidak cukup: {e}")
            return False
