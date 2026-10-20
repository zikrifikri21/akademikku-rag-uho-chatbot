# Dockerfile uho_rag_api (FastAPI)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# PyTorch CPU dulu (hemat bandwidth, hindari timeout)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Unduh model saat build (bukan saat container start). Harus sama dengan EMBEDDING_MODEL / RERANK_MODEL.
ARG EMBEDDING_MODEL=BAAI/bge-m3
ARG RERANK_MODEL=BAAI/bge-reranker-v2-m3
RUN python -c "import sys; from huggingface_hub import snapshot_download as d; \
[d(m, ignore_patterns=['onnx/*','openvino/*','*.onnx','*.onnx_data','imgs/*']) for m in sys.argv[1:]]" \
    "$EMBEDDING_MODEL" "$RERANK_MODEL"

# Kode + folder index (chroma_db_akademik/) kalau ada di konteks build; atau mount sebagai volume dan set CHROMA_DIR.
COPY . .

EXPOSE 8001
# start-period panjang: memuat bge-m3 + reranker + BM25 butuh waktu
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 CMD curl -fs http://localhost:8001/health || exit 1

# Satu worker: model dimuat sekali di memori
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
