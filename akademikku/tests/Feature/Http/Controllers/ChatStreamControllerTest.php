<?php

declare(strict_types=1);

use App\Models\Chat;
use App\Models\User;
use App\Enums\ModelName;
use Illuminate\Support\Facades\Http;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('ChatStreamController', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
        $this->chat = Chat::factory()->for($this->user)->create();
    });

    it('streams text response correctly', function (): void {
        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'text_delta', 'content' => 'Hello, how can I help you today?'])."\n",
                200
            ),
        ]);

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => 'Hello',
            'model' => ModelName::GPT_OSS_20B->value,
        ]);

        $response->assertOk();
        $response->assertStreamed();

        $content = $response->streamedContent();
        expect($content)->toContain('"eventType":"text_delta"');
        expect($content)->toContain('Hello, how can I help you today?');
    });

    it('handles thinking and text streaming response', function (): void {
        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'thinking', 'content' => 'Mencari dokumen...'])."\n".
                json_encode(['eventType' => 'text_delta', 'content' => 'Let me think about this...'])."\n",
                200
            ),
        ]);

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => 'Explain quantum computing',
            'model' => ModelName::GPT_OSS_20B->value,
        ]);

        $response->assertOk();
        $response->assertStreamed();

        $content = $response->streamedContent();
        expect($content)->toContain('"eventType":"thinking"');
        expect($content)->toContain('"eventType":"text_delta"');
        expect($content)->toContain('Let me think about this...');
    });

    it('saves user and assistant messages to database', function (): void {
        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'text_delta', 'content' => 'I understand your question.'])."\n",
                200
            ),
        ]);

        $initialMessageCount = $this->chat->messages()->count();

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => 'What is the weather like?',
            'model' => ModelName::GPT_OSS_20B->value,
        ]);

        $response->assertOk();
        $content = $response->streamedContent();
        expect($content)->toContain('I understand your question.');

        expect($this->chat->messages()->count())->toBe($initialMessageCount + 2);

        $userMessage = $this->chat->messages()->where('role', 'user')->latest()->first();
        $assistantMessage = $this->chat->messages()->where('role', 'assistant')->latest()->first();

        expect($userMessage->parts)->toBe(['text' => 'What is the weather like?']);
        expect($assistantMessage->parts)->toBe(['text' => 'I understand your question.']);
    });

    it('trims whitespace from user message', function (): void {
        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'text_delta', 'content' => 'Response'])."\n",
                200
            ),
        ]);

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => '  Hello with spaces  ',
            'model' => ModelName::GPT_OSS_20B->value,
        ]);

        $response->assertOk();

        $userMessage = $this->chat->messages()->where('role', 'user')->latest()->first();
        expect($userMessage->parts)->toBe(['text' => 'Hello with spaces']);
    });

    it('updates chat timestamp', function (): void {
        $originalUpdatedAt = $this->chat->updated_at;

        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'text_delta', 'content' => 'Response'])."\n",
                200
            ),
        ]);

        $this->travel(1)->minute();

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => 'Test message',
        ]);

        $response->assertOk();
        $content = $response->streamedContent();
        expect($content)->toContain('Response');

        $this->chat->refresh();
        expect($this->chat->updated_at)->toBeGreaterThan($originalUpdatedAt);
    });

    it('preserves existing chat messages during streaming', function (): void {
        $this->chat->messages()->create([
            'role' => 'user',
            'parts' => ['text' => 'Previous user message'],
            'attachments' => '[]',
        ]);
        $this->chat->messages()->create([
            'role' => 'assistant',
            'parts' => ['text' => 'Previous assistant message'],
            'attachments' => '[]',
        ]);

        Http::fake([
            config('services.rag_api.url').'/api/rag/stream' => Http::response(
                json_encode(['eventType' => 'text_delta', 'content' => 'New response'])."\n",
                200
            ),
        ]);

        $response = $this->post(route('chat.stream', $this->chat), [
            'message' => 'New message',
        ]);

        $response->assertOk();
        $content = $response->streamedContent();
        expect($content)->toContain('New response');

        expect($this->chat->messages()->count())->toBe(4);

        $messages = $this->chat->messages()->orderBy('created_at')->get();
        expect($messages[0]->parts)->toBe(['text' => 'Previous user message']);
        expect($messages[1]->parts)->toBe(['text' => 'Previous assistant message']);
        expect($messages[2]->parts)->toBe(['text' => 'New message']);
        expect($messages[3]->parts)->toBe(['text' => 'New response']);
    });
});
