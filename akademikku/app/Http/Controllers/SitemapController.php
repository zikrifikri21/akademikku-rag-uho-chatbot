<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate sitemap.xml secara dinamis.
     *
     * Daftarkan hanya halaman PUBLIK yang boleh diindex Google:
     * landing page, tentang, FAQ, halaman bantuan, dll.
     *
     * JANGAN masukkan halaman percakapan/chat pribadi user,
     * halaman yang butuh login, atau route API di sini.
     */
    public function index(): Response
    {
        $urls = [
            [
                'loc' => route('home'),
                'changefreq' => 'weekly',
                'priority' => '1.0',
            ],
            [
                'loc' => url('/login'),
                'changefreq' => 'yearly',
                'priority' => '0.3',
            ],
            [
                'loc' => url('/register'),
                'changefreq' => 'yearly',
                'priority' => '0.3',
            ],

            // Kalau nanti ada halaman artikel/panduan publik dari database,
            // tambahkan looping di sini, misalnya:
            //
            // ...Artikel::where('is_public', true)->get()->map(fn ($a) => [
            //     'loc' => route('artikel.show', $a->slug),
            //     'changefreq' => 'monthly',
            //     'priority' => '0.5',
            //     'lastmod' => $a->updated_at->toAtomString(),
            // ])->all(),
        ];

        $xml = view('sitemap', compact('urls'))->render();

        return response($xml, 200)
            ->header('Content-Type', 'application/xml');
    }
}
