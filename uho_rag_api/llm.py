"""Layanan LLM (Groq): pemilihan model yang diizinkan, penulisan ulang query, dan jawaban berformat JSON."""

import json
import re
from functools import lru_cache
from typing import Optional

import config


@lru_cache(maxsize=8)
def _chat(model: str):
    from langchain_groq import ChatGroq
    return ChatGroq(model=model, api_key=config.GROQ_API_KEY, temperature=0, timeout=60, max_retries=2)


def pilih_model(model: Optional[str]) -> str:
    if model and model in config.ALLOWED_MODELS:
        return model
    if model:
        print(f"[llm] model {model!r} tidak ada di ALLOWED_MODELS -> pakai {config.DEFAULT_MODEL}")
    return config.DEFAULT_MODEL


def urai_json(teks: str) -> Optional[dict]:
    """JSON dari keluaran LLM (toleran terhadap pagar ```json). None kalau bukan objek JSON."""
    try:
        out = json.loads(re.sub(r"^```(?:json)?|```$", "", (teks or "").strip(), flags=re.M).strip())
        return out if isinstance(out, dict) else None
    except ValueError:
        return None


def tulis_ulang(pertanyaan: str, riwayat: list, model: Optional[str] = None) -> str:
    """Satu panggilan: bahasa lisan -> kalimat pencarian formal, sekaligus menjadikan pertanyaan lanjutan berdiri sendiri."""
    riwayat_teks = "\n".join(f"{m['role']}: {m['content']}" for m in riwayat[-4:])
    pesan = (f"Riwayat percakapan:\n{riwayat_teks}\n\n" if riwayat_teks else "") + f"Pertanyaan terbaru: {pertanyaan}"
    try:
        hasil = _chat(pilih_model(model)).invoke([("system", config.REWRITE_PROMPT), ("human", pesan)]).content
        return hasil.strip().strip('"') or pertanyaan
    except Exception as e:
        print(f"[llm] tulis_ulang gagal, pakai pertanyaan asli: {e}")
        return pertanyaan


def tanya_json(pesan: list, model: Optional[str] = None) -> Optional[dict]:
    """Panggil LLM dalam mode JSON; coba sekali lagi kalau keluarannya bukan JSON valid. None kalau tetap gagal."""
    llm = _chat(pilih_model(model)).bind(response_format={"type": "json_object"})
    for _ in range(2):
        out = urai_json(llm.invoke(pesan).content)
        if out:
            return out
    print("[llm] LLM tidak mengembalikan JSON valid")
    return None
