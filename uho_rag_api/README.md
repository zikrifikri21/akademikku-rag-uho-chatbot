# UHO RAG API

Microservice FastAPI untuk chatbot akademik UHO. Implementasi serving dari notebook
`rag_akademik_uho_pipeline_v3` (retrieval hybrid vektor + BM25 -> reranker -> jawaban JSON bersitasi),
dipanggil dari backend Laravel `akademikku` menggantikan pemanggilan Prism/Groq langsung.

Perilaku jawaban:
- Ada di dokumen: jawaban + baris `Sumber: [n] <dokumen>, Pasal X, hal. N (halaman PDF)`.
- Tidak ada (skor di bawah `MIN_RERANK_SCORE`, LLM menyatakan tidak ditemukan, atau tanpa sitasi valid):
  *"Maaf, saya tidak menemukan informasi itu di dokumen akademik resmi UHO yang tersedia. Silakan hubungi bagian akademik fakultas Anda."*
- Tidak ada fallback web: hanya dokumen yang ada di index.

## 1. Setup

```bash
python -m venv venv && source venv/bin/activate     # Windows: venv\Scripts\activate
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
cp .env.example .env     # isi GROQ_API_KEY dan INTERNAL_API_KEY
```

Salin folder **`chroma_db_akademik/`** dari notebook (Drive) ke server dan arahkan `CHROMA_DIR` ke situ.
`EMBEDDING_MODEL` harus sama dengan notebook (`BAAI/bge-m3`) dan versi `chromadb` harus sama dengan Colab
(tempel hasil sel "Catat versi paket" ke `requirements.txt`). Kalau koleksi tidak ada/kosong atau model embedding
tidak cocok, service **gagal start dengan pesan jelas** (tidak diam-diam menjawab "tidak tersedia").

## 2. Jalankan

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```
`GET /health` -> `{"status": "ok"}`. Startup memuat embedding, reranker, dan BM25 (beberapa menit di CPU).

## 3. Kontrak API

**POST** `/api/rag/stream` (header `X-Internal-Api-Key` kalau `INTERNAL_API_KEY` diisi)

```json
{
  "message": "apakah bisa saya ajukan cuti lagi kalau saya sudah pernah cuti 2x?",
  "model": "openai/gpt-oss-20b",
  "history": [{"role": "user", "content": "halo"}, {"role": "assistant", "content": "halo, ada yang bisa dibantu?"}],
  "fakultas": "FMIPA"
}
```
- `model` opsional, harus ada di `ALLOWED_MODELS`; selain itu dipakai `DEFAULT_GROQ_MODEL`.
- `history` opsional (maks. 40 pesan masuk, 10 terakhir dipakai). `role` hanya `user`/`assistant`.
- `fakultas` opsional: mencari di dokumen fakultas itu **dan** dokumen tingkat UNIVERSITAS.

Response NDJSON:
```
{"eventType": "text_delta", "content": "Tergantung jenjang ... [1]"}
{"eventType": "text_delta", "content": "\n\nSumber:\n[1] Peraturan ..., Pasal 96, hal. 69 (halaman PDF)"}
{"eventType": "sources", "content": [{"title": "...", "source": "https://..." , "asal": "vector_store", "pasal": "96", "halaman": 69, "halaman_akhir": 69}]}
```
Jawaban dihasilkan utuh lalu dikirim bertahap (mode JSON diperlukan untuk memvalidasi sitasi), jadi format
`text_delta` / `error` tetap sama dengan yang dipakai frontend. Teks sudah memuat baris "Sumber"; event `sources`
(hanya sumber yang dipakai, `source` = null untuk PDF tanpa URL) opsional untuk dirender sebagai tautan.

## 4. Menyambungkan ke Laravel

Pola di `ChatStreamController::__invoke` tidak berubah dari versi sebelumnya:

```php
use Illuminate\Support\Facades\Http;

return Response::stream(function () use ($chat, $messages, $model): Generator {
    $historyPayload = collect($messages)->map(fn ($m) => [
        'role' => $m instanceof \Prism\Prism\ValueObjects\Messages\UserMessage ? 'user' : 'assistant',
        'content' => $m->content,
    ])->values()->all();

    $response = Http::withHeaders(['X-Internal-Api-Key' => config('services.rag_api.key')])
        ->timeout(0)
        ->withOptions(['stream' => true])
        ->post(config('services.rag_api.url') . '/api/rag/stream', [
            'message' => end($historyPayload)['content'] ?? '',
            'model' => $model->value,
            'history' => array_slice($historyPayload, 0, -1),
        ]);

    $body = $response->toPsrResponse()->getBody();
    $buffer = '';
    $fullText = '';

    while (! $body->eof()) {
        $buffer .= $body->read(1024);
        while (($pos = strpos($buffer, "\n")) !== false) {
            $line = substr($buffer, 0, $pos);
            $buffer = substr($buffer, $pos + 1);
            if ($line === '') {
                continue;
            }
            $event = json_decode($line, true);
            if (($event['eventType'] ?? null) === 'text_delta') {
                $fullText .= $event['content'];
            }
            yield $line . "\n";
        }
    }

    if ($fullText !== '') {
        $chat->messages()->create(['role' => 'assistant', 'parts' => ['text' => $fullText], 'attachments' => '[]']);
        $chat->touch();
    }
});
```
`config/services.php`: `'rag_api' => ['url' => env('RAG_API_URL', 'http://localhost:8001'), 'key' => env('RAG_API_KEY')]`;
`RAG_API_KEY` sama dengan `INTERNAL_API_KEY` di sini. `GuestChatStreamController` memakai pola yang sama dengan `history` dari frontend.

## 5. Catatan

- Update knowledge base: bangun ulang di notebook, salin folder index baru, restart service (kode tidak perlu deploy ulang).
- Kalibrasi `MIN_RERANK_SCORE` dengan pertanyaan nyata (sel evaluasi notebook); log `[rag_engine] ... skor tertinggi` membantu.
- Reranker di CPU lambat. Kalau latensi tinggi: turunkan `RERANK_CANDIDATES`, atau pakai GPU (`DEVICE=cuda`).
  Belum ada batas konkurensi, jadi banyak request bersamaan di CPU akan saling memperlambat.
- Belum ada rate limit; pasang di gateway/Laravel kalau endpoint chat publik (guest).
- Tes: `pip install httpx && python test_smoke.py` (tanpa model dan tanpa Groq).
