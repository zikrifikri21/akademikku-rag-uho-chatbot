<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Client\ConnectionException;

/** Halaman admin/dosen: upload PDF jadi versi pengetahuan baru, pindah versi, dan uji jawaban per versi. */
final class KnowledgeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('settings/Knowledge', [
            'knowledge' => $this->rag()->get('/api/knowledge')->throw()->json(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:51200'],
            'title' => ['required', 'string', 'min:3', 'max:200'],
            'fakultas' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', 'url', 'max:500'],
            'catatan' => ['nullable', 'string', 'max:500'],
            'ganti_doc_id' => ['nullable', 'string', 'max:32'],
            'aktifkan' => ['boolean'],
        ]);

        $file = $request->file('file');

        try {
            $response = $this->rag()->timeout(900)
                ->attach('file', $file->get(), $file->getClientOriginalName())
                ->post('/api/knowledge/upload', [
                    'title' => $data['title'],
                    'fakultas' => $data['fakultas'] ?? 'UNIVERSITAS',
                    'source' => $data['source'] ?? '',
                    'catatan' => $data['catatan'] ?? '',
                    'ganti_doc_id' => $data['ganti_doc_id'] ?? '',
                    'aktifkan' => ($data['aktifkan'] ?? true) ? 'true' : 'false',
                ]);
        } catch (ConnectionException) {
            throw ValidationException::withMessages(['file' => 'Layanan RAG tidak merespons atau terlalu lama. Coba lagi.']);
        }

        if ($response->status() === 422) {
            throw ValidationException::withMessages(['file' => (string) $response->json('detail', 'PDF ditolak')]);
        }
        $response->throw();

        return back();
    }

    public function activate(int $versi): RedirectResponse
    {
        $this->rag()->post("/api/knowledge/versi/{$versi}/aktifkan")->throw();

        return back();
    }

    /** Uji satu pertanyaan ke versi tertentu tanpa mengaktifkannya. */
    public function test(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'versi' => ['required', 'integer', 'min:1'],
        ]);

        try {
            $body = $this->rag()->timeout(300)->post('/api/rag/stream', $data)->throw()->body();
        } catch (ConnectionException|RequestException) {
            return response()->json(['text' => '', 'error' => 'Layanan RAG tidak merespons atau terlalu lama. Coba lagi.'], 502);
        }

        $events = collect(explode("\n", $body))
            ->filter()
            ->map(fn (string $line) => json_decode($line, true));

        return response()->json([
            'text' => $events->where('eventType', 'text_delta')->pluck('content')->implode(''),
            'error' => $events->firstWhere('eventType', 'error')['content'] ?? null,
        ]);
    }

    private function rag(): PendingRequest
    {
        return Http::baseUrl((string) config('services.rag_api.url'))
            ->withHeaders(['X-Internal-Api-Key' => config('services.rag_api.key')])
            ->acceptJson();
    }
}
