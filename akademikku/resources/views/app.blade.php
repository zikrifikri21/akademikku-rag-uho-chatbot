<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"  @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#1e2a78">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Akademikku') }} — Asisten AI Kampus Universitas Halu Oleo</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="application-name" content="{{ config('app.name', 'Akademikku') }}">

        {{-- ==================== SEO ==================== --}}
        <meta name="description" content="{{ $metaDescription ?? 'Akademikku adalah asisten AI (chatbot RAG) resmi Universitas Halu Oleo. Tanya jawab seputar akademik, perkuliahan, jadwal, layanan kemahasiswaan, dan info kampus UHO kapan saja.' }}">
        <meta name="keywords" content="Akademikku, chatbot AI UHO, asisten AI kampus, Universitas Halu Oleo, RAG chatbot kampus, tanya jawab akademik, sistem informasi akademik UHO">
        <meta name="author" content="{{ config('app.name', 'Universitas Halu Oleo') }}">
        <meta name="robots" content="index, follow">
        <link rel="canonical" href="{{ url()->current() }}">

        {{-- ==================== Open Graph / Facebook, WhatsApp, LinkedIn, dll ==================== --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name', 'Akademikku') }}">
        <meta property="og:title" content="{{ $ogTitle ?? (config('app.name', 'Akademikku') . ' — Asisten AI Kampus Universitas Halu Oleo') }}">
        <meta property="og:description" content="{{ $ogDescription ?? ($metaDescription ?? 'Tanya apa saja seputar akademik dan layanan kampus UHO, dijawab instan oleh Akademikku — chatbot AI berbasis RAG.') }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:image" content="{{ $ogImage ?? asset('images/og-image.jpg') }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="{{ config('app.name', 'Akademikku') }} — Asisten AI Kampus UHO">
        <meta property="og:locale" content="id_ID">

        {{-- ==================== Twitter / X Card ==================== --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $ogTitle ?? (config('app.name', 'Akademikku') . ' — Asisten AI Kampus Universitas Halu Oleo') }}">
        <meta name="twitter:description" content="{{ $ogDescription ?? ($metaDescription ?? 'Tanya apa saja seputar akademik dan layanan kampus UHO, dijawab instan oleh Akademikku — chatbot AI berbasis RAG.') }}">
        <meta name="twitter:image" content="{{ $ogImage ?? asset('images/og-image.jpg') }}">
        {{-- <meta name="twitter:site" content="@akun_twitter_kampus"> --}}

        {{-- ==================== Structured data (JSON-LD) — biar Google paham ini aplikasi AI kampus ==================== --}}
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "{{ config('app.name', 'Akademikku') }}",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "description": "Akademikku adalah asisten AI (chatbot berbasis RAG) resmi Universitas Halu Oleo untuk membantu mahasiswa, dosen, dan calon mahasiswa mendapatkan informasi akademik dan layanan kampus secara instan.",
            "url": "{{ url('/') }}",
            "image": "{{ asset('images/og-image.jpg') }}",
            "publisher": {
                "@type": "CollegeOrUniversity",
                "name": "Universitas Halu Oleo",
                "url": "https://uho.ac.id"
            },
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "IDR"
            }
        }
        </script>

        {{-- ==================== Favicon ==================== --}}
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="icon" type="image/webp" sizes="16x16" href="/favicon-16x16.webp">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/webp" sizes="32x32" href="/favicon-32x32.webp">
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">

        {{-- Apple / iOS --}}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Akademikku') }}">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

        {{-- Android / PWA --}}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">
        <meta name="mobile-web-app-capable" content="yes">

        {{-- Manifest & Windows --}}
        <link rel="manifest" href="/site.webmanifest">
        <meta name="msapplication-TileColor" content="#1e2a78">
        <meta name="msapplication-config" content="/browserconfig.xml">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
