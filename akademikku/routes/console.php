<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:admin {email} {--revoke}', function (string $email) {
    $user = User::where('email', $email)->firstOrFail();
    $user->update(['is_admin' => ! $this->option('revoke')]);
    $this->info($user->email.($user->is_admin ? ' sekarang admin.' : ' bukan admin lagi.'));
})->purpose('Jadikan user admin/dosen (boleh upload PDF pengetahuan)');
