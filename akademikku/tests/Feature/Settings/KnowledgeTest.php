<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['services.rag_api.url' => 'http://rag.test', 'services.rag_api.key' => 'rahasia']);
    Http::fake([
        'rag.test/api/knowledge' => Http::response(['aktif' => 1, 'versi' => [['no' => 1, 'docs' => ['base'], 'catatan' => 'x', 'dibuat' => '2026-11-10T00:00:00']], 'dokumen' => []]),
        'rag.test/api/knowledge/upload' => Http::response(['doc_id' => 'abc', 'chunks' => 3, 'versi' => 2, 'aktif' => 2]),
        'rag.test/api/knowledge/versi/*' => Http::response(['aktif' => 1]),
        'rag.test/api/rag/stream' => Http::response('{"eventType":"text_delta","content":"Bisa "}'."\n".'{"eventType":"text_delta","content":"[1]."}'."\n"),
    ]);
});

test('non-admin cannot access knowledge pages', function (): void {
    $this->get('/settings/knowledge')->assertRedirect('/login');

    $user = User::factory()->create();
    $this->actingAs($user)->get('/settings/knowledge')->assertForbidden();
    $this->actingAs($user)->post('/settings/knowledge/versi/1/aktifkan')->assertForbidden();
    $this->actingAs($user)->postJson('/settings/knowledge/uji', ['message' => 'x', 'versi' => 1])->assertForbidden();
    Http::assertNothingSent();
});

test('admin sees versions', function (): void {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->get('/settings/knowledge')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('settings/Knowledge')->where('knowledge.aktif', 1));
});

test('admin uploads pdf as new version', function (): void {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->from('/settings/knowledge')->post('/settings/knowledge', [
        'file' => UploadedFile::fake()->create('aturan.pdf', 100, 'application/pdf'),
        'title' => 'Peraturan Baru 2026',
        'fakultas' => 'FMIPA',
        'aktifkan' => true,
    ])->assertSessionHasNoErrors()->assertRedirect('/settings/knowledge');

    Http::assertSent(fn (Request $request) => $request->url() === 'http://rag.test/api/knowledge/upload'
        && $request->hasHeader('X-Internal-Api-Key', 'rahasia')
        && $request->isMultipart());
});

test('upload rejects non pdf', function (): void {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->post('/settings/knowledge', [
        'file' => UploadedFile::fake()->create('x.exe', 10),
        'title' => 'Judul',
    ])->assertSessionHasErrors('file');
});

test('rag service down returns friendly error', function (): void {
    $admin = User::factory()->create(['is_admin' => true]);
    Http::fake(['*' => fn () => throw new ConnectionException('cURL error 28')]);

    $this->actingAs($admin)->postJson('/settings/knowledge/uji', ['message' => 'cuti?', 'versi' => 1])
        ->assertStatus(502)
        ->assertJsonMissing(['error' => 'cURL error 28'])
        ->assertJsonPath('error', 'Layanan RAG tidak merespons atau terlalu lama. Coba lagi.');

    $this->actingAs($admin)->post('/settings/knowledge', [
        'file' => UploadedFile::fake()->create('aturan.pdf', 100, 'application/pdf'),
        'title' => 'Peraturan Baru 2026',
    ])->assertSessionHasErrors('file');
});

test('admin activates version and tests answers', function (): void {
    $admin = User::factory()->create(['is_admin' => true]);

    $this->actingAs($admin)->from('/settings/knowledge')->post('/settings/knowledge/versi/1/aktifkan')->assertRedirect('/settings/knowledge');
    $this->actingAs($admin)->postJson('/settings/knowledge/uji', ['message' => 'cuti?', 'versi' => 2])
        ->assertOk()->assertJson(['text' => 'Bisa [1].', 'error' => null]);

    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/api/rag/stream') && $request['versi'] === 2);
});
