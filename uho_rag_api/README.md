# UHO RAG API

Microservice FastAPI yang menyediakan jawaban chatbot berbasis RAG (vector
store hasil scraping web + PDF, dengan fallback web search live) untuk
dipanggil dari backend Laravel `akademikku` yang sudah ada — menggantikan
pemanggilan Prism/Groq langsung di `ChatStreamController` dan
`GuestChatStreamController`.

## 1. Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# isi GROQ_API_KEY, TAVILY_API_KEY (opsional), dan pastikan CHROMA_DIR
# menunjuk ke folder chroma_db_uho hasil notebook Colab kamu
```

**Penting**: copy folder `chroma_db_uho/` (hasil embedding dari notebook
Colab) ke server tempat FastAPI ini jalan, lalu arahkan `CHROMA_DIR` di
`.env` ke situ. `EMBEDDING_MODEL` di `.env` harus **sama persis** dengan
yang dipakai saat membangun vector store di notebook, karena beda model
embedding = beda ruang vektor = pencarian tidak akan cocok.

## 2. Jalankan

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Cek: `GET http://localhost:8001/health` -> `{"status": "ok"}`

## 3. Kontrak API

**POST** `/api/rag/stream`

Body:
```json
{
  "message": "apa saja syarat pengajuan cuti akademik di UHO?",
  "model": "openai/gpt-oss-20b",
  "history": [
    {"role": "user", "content": "halo"},
    {"role": "assistant", "content": "halo juga, ada yang bisa dibantu?"}
  ],
  "fakultas": "FMIPA"
}
```
- `model` opsional -- kalau kosong pakai `DEFAULT_GROQ_MODEL` dari `.env`. Dilewatkan apa adanya ke Groq, jadi bisa pakai id yang sama dengan `ModelName` enum di Laravel (`openai/gpt-oss-20b`, `openai/gpt-oss-120b`, dst).
- `history` opsional -- riwayat percakapan, hanya 10 pesan terakhir yang dipakai.
- `fakultas` opsional -- kalau dikirim dan pertanyaan tidak menyebut dokumen tertentu secara eksplisit, pencarian difilter ke fakultas ini (metadata yang sudah ada di vector store).

Response: `StreamingResponse` NDJSON, satu event per baris:
```
{"eventType": "text_delta", "content": "Berdasarkan"}
{"eventType": "text_delta", "content": " Peraturan..."}
{"eventType": "sources", "content": [{"title": "...", "source": "https://...", "asal": "vector_store"}]}
```
Format `text_delta`/`error` ini **sama** dengan yang sudah dipakai
`ChatStreamController` saat ini, jadi frontend React tidak perlu diubah.
Event `sources` adalah tambahan baru -- opsional untuk dirender di UI
(mis. daftar link "Sumber" di bawah tiap jawaban).

## 4. Menyambungkan ke Laravel (ChatStreamController)

Ganti bagian yang memanggil `Prism::text()...` dengan HTTP call streaming
ke service ini. Contoh pola di `ChatStreamController::__invoke`:

```php
use Illuminate\Support\Facades\Http;

return Response::stream(function () use ($chat, $messages, $model): Generator {
    $historyPayload = collect($messages)->map(fn ($m) => [
        'role' => $m instanceof \Prism\Prism\ValueObjects\Messages\UserMessage ? 'user' : 'assistant',
        'content' => $m->content,
    ])->values()->all();

    $response = Http::withHeaders([
            'X-Internal-Api-Key' => config('services.rag_api.key'),
        ])
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
        $chat->messages()->create([
            'role' => 'assistant',
            'parts' => ['text' => $fullText],
            'attachments' => '[]',
        ]);
        $chat->touch();
    }
});
```

Tambahkan di `config/services.php`:
```php
'rag_api' => [
    'url' => env('RAG_API_URL', 'http://localhost:8001'),
    'key' => env('RAG_API_KEY'),
],
```

Dan di `.env` Laravel:
```
RAG_API_URL=http://localhost:8001
RAG_API_KEY=samakan-dengan-INTERNAL_API_KEY-di-fastapi
```

`GuestChatStreamController` bisa diubah dengan pola yang sama, cukup
riwayat percakapannya diambil dari `history` yang dikirim frontend
(bukan dari database `messages`).

## 5. Catatan

- Muat model embedding & vector store terjadi sekali saat startup
  (`lifespan`), bukan per-request -- jadi request pertama setelah restart
  server akan sedikit lebih lambat (loading model), request berikutnya cepat.
- Kalau nanti kamu update knowledge base di notebook Colab, cukup copy ulang
  folder `chroma_db_uho/` yang baru ke server ini dan restart service --
  tidak perlu deploy ulang kode.
- `INTERNAL_API_KEY` sebaiknya diisi di production supaya endpoint ini tidak
  bisa dipanggil sembarang orang yang tahu URL-nya (service ini didesain
  dipanggil server-to-server dari Laravel, bukan langsung dari browser).
