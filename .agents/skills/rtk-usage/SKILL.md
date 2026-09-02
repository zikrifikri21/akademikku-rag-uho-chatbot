---
name: rtk-usage
description: "Gunakan skill ini saat bekerja di terminal proyek ini dan perlu menjalankan perintah shell dengan hemat token melalui `rtk`. Aktifkan ketika akan membaca file, mencari teks, menjalankan test, build, git status, atau command terminal rutin lain yang sebaiknya diproksikan lewat `rtk`."
license: MIT
metadata:
  author: openai
---

# RTK Usage

## Tujuan

`rtk` adalah proxy CLI untuk menghemat token saat menjalankan command terminal. Di proyek ini, default terbaik adalah menjalankan command shell dengan prefix `rtk`.

## Aturan Utama

Selalu prefix command shell dengan `rtk`.

Contoh:

```bash
rtk git status
rtk rg -n "Tryout" app resources tests
rtk php artisan test --compact tests/Feature/TryoutTest.php
rtk npm run build
rtk vendor/bin/pint --dirty --format agent
```

## Kapan Dipakai

Gunakan `rtk` untuk:

- inspeksi file dan pencarian teks
- menjalankan test
- build frontend
- formatter dan linter
- git command non-destruktif
- artisan command rutin

## Kapan Jangan Dipakai

Jangan pakai `rtk` bila memang perlu bypass filtering dan menjalankan command asli apa adanya. Untuk kasus itu, gunakan:

```bash
rtk proxy powershell -NoProfile -Command "..."
```

## Meta Commands

Gunakan command berikut untuk verifikasi atau melihat dampak penghematan token:

```bash
rtk --version
rtk gain
rtk gain --history
```

## Pola Kerja yang Disarankan

1. Mulai dari `rtk` untuk hampir semua command shell.
2. Kalau perlu command raw atau quoting yang lebih sensitif, pakai `rtk proxy`.
3. Tetap ikuti aturan sandbox, approval, dan safety project meskipun command dijalankan lewat `rtk`.

## Catatan Penting

- `rtk` membantu efisiensi token, bukan pengganti pertimbangan keamanan.
- Untuk command yang berpotensi destruktif, tetap minta approval bila dibutuhkan.
- Saat menulis dokumentasi atau memberi contoh ke user, tampilkan contoh yang sudah memakai prefix `rtk` agar konsisten.
