# Log keputusan (ADR ringkas)

Catatan keputusan penting beserta alasannya. Format ringkas: **Keputusan → Alasan →
Alternatif ditolak**. Urut dari yang terbaru.

---

## ADR-006 — Upload terjadi langsung di Hero landing (model "iLovePDF")

- **Tanggal:** 28 Juni 2026
- **Keputusan:** Kartu upload diletakkan di Hero halaman depan dan dibuat fungsional;
  tombol "Mulai memilah" langsung memanggil backend lalu pindah ke `/processing/:jobId`.
- **Alasan:** Pengalaman tanpa friksi seperti iLovePDF/iLoveIMG — user bisa upload begitu
  membuka situs, tanpa akun atau pindah halaman. Sesuai referensi Figma yang menaruh
  upload di Hero.
- **Alternatif ditolak:** Halaman `/upload` terpisah (menambah satu langkah klik tanpa
  manfaat). Route `/upload` lama dihapus.

## ADR-005 — Teks UI Bahasa Indonesia, layout persis referensi Inggris

- **Tanggal:** 28 Juni 2026
- **Keputusan:** Port layout/style referensi apa adanya, tapi terjemahkan semua copy ke
  Bahasa Indonesia.
- **Alasan:** Konvensi proyek (CLAUDE.md) mewajibkan teks user-facing & komentar dalam
  Bahasa Indonesia; target pengguna FotoQu berbahasa Indonesia.
- **Alternatif ditolak:** Menyalin copy Inggris apa adanya (melanggar konvensi).

## ADR-004 — Adopsi `motion` + `lucide-react`, tetap di Tailwind v3

- **Tanggal:** 28 Juni 2026
- **Keputusan:** Tambah dependency `motion` (animasi) dan `lucide-react` (ikon) agar hasil
  persis referensi; **tidak** migrasi ke Tailwind v4.
- **Alasan:** Komponen referensi memakai inline-style + utility layout (bukan token tema),
  jadi kompatibel dengan Tailwind v3 — migrasi v4 tak perlu dan berisiko. Dua dependency
  itu yang benar-benar dibutuhkan untuk match visual.
- **Alternatif ditolak:** (a) Ikut stack penuh referensi (Tailwind v4 + MUI + Radix +
  shadcn) — migrasi besar tak sebanding. (b) Tanpa dependency baru (emoji + CSS) — hasil
  tidak 100% persis.

## ADR-003 — Layar proses didesain ulang, logika integrasi dipertahankan utuh

- **Tanggal:** 28 Juni 2026
- **Keputusan:** Restyle `Processing` & `Results` ke design system baru, tapi pertahankan
  persis logika `EventSource`/SSE, fallback polling, auto-navigate, dan semua call
  `api/client.ts`.
- **Alasan:** Wiring backend sudah teruji jalan; redesign murni lapisan tampilan. Mengubah
  logika tanpa alasan menambah risiko regresi.
- **Alternatif ditolak:** Menulis ulang alur data frontend (tidak diperlukan).

## ADR-002 — Arsitektur backend/frontend terpisah (FastAPI + SPA)

- **Tanggal:** ~27 Juni 2026 (migrasi dari Streamlit)
- **Keputusan:** Pisahkan ML/IO murni (`backend/src/`, bebas framework) dari web concern
  (`backend/api/` + `backend/core/`) dan rendering (`frontend/`).
- **Alasan:** `src/` jadi reusable sebagai library; web layer bisa diganti tanpa menyentuh
  ML. Frontend modern (React) menggantikan Streamlit.
- **Alternatif ditolak:** Tetap di Streamlit (UI terbatas, sulit dikustom sesuai referensi).

## ADR-001 — Job async + SSE untuk pipeline yang lama

- **Tanggal:** ~27 Juni 2026
- **Keputusan:** Pipeline ML jalan sebagai job async via `BackgroundTasks`; request balas
  `job_id`; progress di-stream via Server-Sent Events. State job in-memory di
  `core/job_store.py`.
- **Alasan:** Pipeline berlangsung menit-an — tak boleh memblok request. Async menjaga
  server responsif & mengizinkan job paralel.
- **Catatan/keterbatasan:** Async **tidak** mempercepat satu batch clustering (UMAP/HDBSCAN
  global). State in-memory hanya cocok single-instance (lihat
  [`constraints-and-open-questions.md`](constraints-and-open-questions.md)).
- **Alternatif ditolak:** Jalankan ML di dalam request (timeout/blocking); job queue
  eksternal (Celery/Redis) — berlebihan untuk skala saat ini.
