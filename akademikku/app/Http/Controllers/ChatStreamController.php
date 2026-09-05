<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Generator;
use Throwable;
use App\Models\Chat;
use App\Models\Message;
use App\Enums\ModelName;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Http\Requests\ChatStreamRequest;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class ChatStreamController extends Controller
{
    public function __invoke(ChatStreamRequest $request, Chat $chat): StreamedResponse
    {
        $userMessage = $request->string('message')->trim()->value();
        $model = $request->enum('model', ModelName::class, ModelName::GPT_OSS_20B);

        $historyPayload = $this->buildConversationHistory($chat);

        $chat->messages()->create([
            'role' => 'user',
            'parts' => [
                'text' => $userMessage,
            ],
            'attachments' => '[]',
        ]);

        return Response::stream(function () use ($chat, $userMessage, $model, $historyPayload): Generator {
            $parts = [
                'text' => '',
                'thinking' => '',
            ];

            try {
                $response = Http::withHeaders([
                        'X-Internal-Api-Key' => config('services.rag_api.key'),
                    ])
                    ->timeout(0)
                    ->withOptions(['stream' => true])
                    ->post(config('services.rag_api.url').'/api/rag/stream', [
                        'message' => $userMessage,
                        'model' => $model->value,
                        'history' => $historyPayload,
                    ]);

                $body = $response->toPsrResponse()->getBody();
                $buffer = '';

                while (! $body->eof()) {
                    $buffer .= $body->read(1024);
                    while (($pos = strpos($buffer, "\n")) !== false) {
                        $line = substr($buffer, 0, $pos);
                        $buffer = substr($buffer, $pos + 1);
                        if ($line === '') {
                            continue;
                        }

                        $decoded = json_decode($line, true);
                        if (is_array($decoded)) {
                            if (($decoded['eventType'] ?? null) === 'text_delta') {
                                $parts['text'] .= $decoded['content'] ?? '';
                            } elseif (($decoded['eventType'] ?? null) === 'thinking') {
                                $content = (string) ($decoded['content'] ?? '');
                                if (! str_contains($content, 'Sedang mencari dokumen') && ! str_contains($content, 'Mencari dokumen')) {
                                    $parts['thinking'] .= $content;
                                }
                            }
                        }

                        yield $line."\n";
                    }
                }

                if ($parts['text'] !== '' || $parts['thinking'] !== '') {
                    $chat->messages()->create([
                        'role' => 'assistant',
                        'parts' => array_filter($parts, fn ($value) => $value !== ''),
                        'attachments' => '[]',
                    ]);
                    $chat->touch();
                }

            } catch (Throwable $throwable) {
                Log::error("Chat stream error for chat $chat->id: ".$throwable->getMessage());
                yield json_encode([
                    'eventType' => 'error',
                    'content' => 'Stream failed',
                ])."\n";
            }
        });
    }

    private function buildConversationHistory(Chat $chat): array
    {
        return $chat->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn (Message $message): array => [
                'role' => $message->role === 'assistant' ? 'assistant' : 'user',
                'content' => $message->parts['text'] ?? '',
            ])
            ->toArray();
    }
}

