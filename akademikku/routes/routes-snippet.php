<?php

use App\Http\Controllers\SitemapController;

// Sitemap XML
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Robots.txt
Route::get('/robots.txt', function () {
    $content = "User-agent: *\n";
    $content .= "Allow: /\n";
    $content .= "Sitemap: " . url('/sitemap.xml') . "\n";
    return response($content)->header('Content-Type', 'text/plain');
})->name('robots');

// Favicon routes — pastikan file-file ini ada di public/
Route::get('/favicon.ico', fn() => response()->file(public_path('favicon.ico')));
Route::get('/favicon-16x16.png', fn() => response()->file(public_path('favicon-16x16.png')));
Route::get('/favicon-32x32.png', fn() => response()->file(public_path('favicon-32x32.png')));
Route::get('/apple-touch-icon.png', fn() => response()->file(public_path('apple-touch-icon.png')));
Route::get('/android-chrome-192x192.png', fn() => response()->file(public_path('android-chrome-192x192.png')));
Route::get('/android-chrome-512x512.png', fn() => response()->file(public_path('android-chrome-512x512.png')));
Route::get('/site.webmanifest', fn() => response()->file(public_path('site.webmanifest'))->header('Content-Type', 'application/manifest+json'));
Route::get('/browserconfig.xml', fn() => response()->file(public_path('browserconfig.xml'))->header('Content-Type', 'application/xml'));
