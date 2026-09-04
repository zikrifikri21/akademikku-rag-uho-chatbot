<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Generator;
use App\Enums\ModelName;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class GuestChatStreamController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'model' => ['nullable', 'string'],
            'history' => ['nullable', 'array'],
        ]);

        $userMessage = $request->string('message')->trim()->value();
        $modelInput = $request->input('model');
        $model = ModelName::tryFrom((string) $modelInput) ?? ModelName::GPT_OSS_20B;
        $historyInput = $request->input('history', []);

        $historyPayload = [];
        if (is_array($historyInput)) {
            foreach ($historyInput as $msg) {
                if (! is_array($msg)) {
                    continue;
                }
                $role = $msg['role'] ?? 'user';
                $text = '';
                if (isset($msg['parts']) && is_array($msg['parts'])) {
                    $text = $msg['parts']['text'] ?? '';
                } elseif (isset($msg['content']) && is_string($msg['content'])) {
                    $text = $msg['content'];
                }

                if ($text !== '') {
                    $historyPayload[] = [
                        'role' => $role === 'assistant' ? 'assistant' : 'user',
                        'content' => $text,
                    ];
                }
            }
        }

        return Response::stream(function () use ($userMessage, $model, $historyPayload): Generator {
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
                    yield $line."\n";
                }
            }
        });
    }
}
