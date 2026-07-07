# Batasan & pertanyaan terbuka

Daftar batasan teknis/produk yang diketahui dan pertanyaan yang belum terjawab. Berguna
saat merencanakan iterasi berikutnya.

## Batasan teknis (diketahui)

### Performa & skala
- **Async ≠ lebih cepat per batch.** `BackgroundTasks`/async menjaga server responsif &
  mengizinkan job paralel, tapi **tidak** mempercepat satu batch clustering. UMAP/HDBSCAN
  adalah operasi global atas semua embedding; tak bisa dipartisi tanpa menurunkan kualitas.
  Percepatan satu-batch nyata butuh **GPU** (CUDA InsightFace, opsional cuML).
- **CPU default.** `load_model()` mengutamakan CUDA lalu fallback CPU. Tanpa GPU, koleksi
  besar (ribuan foto) bisa makan waktu cukup lama.

### State & persistensi
- **State job in-memory** (`core/job_store.py`). Konsekuensi:
  - Hanya cocok untuk **single-instance**. Multi-instance butuh Redis/DB.
  - Semua job **hilang saat server restart** (termasuk hasil yang belum diunduh).
  - Tidak ada pembersihan otomatis terjadwal yang terdokumentasi di sini — perlu dipastikan
    foto per-job di `TEMP_DIR/jobs/<job_id>` dibersihkan.

### Input & format
- **Limit upload** disebut di UI/FAQ sebagai ~3.000 foto per unggahan. Pastikan angka ini
  konsisten dengan `src/config.py` (sumber kebenaran limit sebenarnya).
- **Format didukung:** JPG, JPEG, PNG, HEIC, HEIF, WebP. **RAW belum didukung.**
- **Google Drive** butuh `GOOGLE_API_KEY` dan folder di-set "Anyone with the link".
  Upload biasa tidak butuh key.

### Kualitas & testing
- **Tidak ada test suite / linter Python.** Gerbang CI terdekat adalah `npm run build`
  (type-check frontend). Logika ML tidak punya pengaman regresi otomatis.
- Parameter UMAP & HDBSCAN bucket terbesar adalah konstanta tuned (NB09) — ubah dengan
  sangat hati-hati.

## Batasan dari redesign UI (Juni 2026)

- **Konten marketing masih placeholder.** `OutputPreview` & `Features` memakai data statis
  dan gambar Unsplash eksternal (dekoratif). Gambar eksternal bisa lambat / membuat
  screenshot otomatis menunggu network-idle (artefak tooling, bukan bug).
- **Link footer "Privasi / Ketentuan / Kontak"** masih `href="#"` (belum ada halaman).
- **Animasi Hero (indikator scroll) berjalan tanpa henti** — membuat screenshot otomatis
  pada Hero kadang timeout; tidak memengaruhi pengguna.
- Alias warna Tailwind lama (`cream/sand/sandborder`) sengaja dipertahankan sebagai jaring
  pengaman; bisa dibersihkan setelah dipastikan tak ada kelas lama tersisa.

## Pertanyaan terbuka

1. **Pembersihan job/temp** — kapan & bagaimana folder per-job dan entri `JOBS` dibersihkan?
   Perlu TTL atau job sweeper?
2. **Persistensi hasil** — apakah hasil perlu bertahan setelah restart (mis. simpan ke
   disk/DB), atau ephemeral by design (sesuai klaim privasi) memang diinginkan?
3. **Penamaan cluster** — saat ini "Orang A/B/…" otomatis. Apakah perlu fitur rename di UI
   (bukan hanya setelah unduh)?
4. **Limit sebenarnya** — angka 3.000 foto di FAQ vs nilai di `src/config.py`: mana yang
   mengikat, dan apa perilaku saat terlampaui?
5. **Halaman legal** — apakah Privasi/Ketentuan/Kontak akan dibuat? Jika ya, butuh konten.
6. **Deployment** — target hosting backend (yang mendukung GPU?) dan frontend belum
   ditentukan di dokumen.
