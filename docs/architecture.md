# Arsitektur & alur sistem

Dokumen ini merinci bagaimana FotoQu bekerja dari klik upload sampai unduhan ZIP.

## Prinsip pemisahan

Aplikasi dibagi dua bagian **independen**:

- **`backend/`** — FastAPI yang mengekspos pipeline ML sebagai HTTP API. Job berjalan
  async, progress di-stream via SSE.
- **`frontend/`** — SPA React + Vite + Tailwind yang **hanya** memanggil API. Tidak ada
  logika ML di sisi klien.

Aturan layering backend (jaga tetap terpisah):

| Folder | Tanggung jawab | Catatan |
|--------|----------------|---------|
| `backend/src/` | Logika ML/IO murni (pipeline, clustering, face extractor, drive handler, utils). | **Bebas framework web** — reusable sebagai library. |
| `backend/core/` | Glue runtime: `job_store.py` (dict `JOBS` in-memory berisi `JobState`) dan `tasks.py` (runner background yang memanggil pipeline & update progress). | Pengganti `session_state` versi Streamlit lama. |
| `backend/api/` | Router FastAPI: `jobs.py` (create/status/SSE), `results.py` (clusters JSON, gambar, ZIP). | |
| `backend/main.py` | App factory: `lifespan` memuat model InsightFace sekali saat startup; CORS; include routers. | |

## Alur end-to-end

```
PENGGUNA                  FRONTEND (SPA)                 BACKEND (FastAPI)
   │                          │                               │
   │  pilih file di Hero      │                               │
   ├─────────────────────────▶│                               │
   │                          │  POST /api/jobs/upload|drive   │
   │                          ├──────────────────────────────▶│  new_job() → JobState
   │                          │            { job_id }          │  BackgroundTasks.add_task(...)
   │                          │◀──────────────────────────────┤
   │   navigate               │                               │   ┌─ pipeline jalan async ─┐
   │  /processing/:id         │  GET /api/jobs/:id/progress    │   │ tahap 1: deteksi+embed │
   │                          ├═══════════════════════════════▶   │   (0–50%)              │
   │   lihat progress %       │◀══ SSE: status, progress_pct ═│   │ tahap 2: clustering    │
   │                          │                               │   │   (50–100%)            │
   │                          │   status == "done"            │   └────────────────────────┘
   │   auto navigate          │  GET /api/jobs/:id/clusters    │
   │  /results/:id            ├──────────────────────────────▶│  metrics + daftar cluster
   │                          │◀──────────────────────────────┤
   │   lihat galeri           │  GET .../thumb /photos /:pid   │  JPEG / JSON per kebutuhan
   │                          ├──────────────────────────────▶│  (lazy-load saat expand)
   │   klik download          │  GET .../download?cids=1,2     │
   │                          ├──────────────────────────────▶│  ZIP berstruktur folder
   │◀═════════ file ZIP ══════┤◀──────────────────────────────┤
```

### Kenapa async?

Pipeline ML berlangsung lama, jadi **tidak pernah** jalan di dalam request. `POST` membuat
`JobState`, menjadwalkan kerja via `BackgroundTasks`, lalu langsung balas `job_id`. Frontend
berlangganan `GET /api/jobs/{id}/progress` (SSE) untuk progress live, lalu mengambil hasil
saat `status == "done"`.

> Async/BackgroundTasks membuat server **responsif** dan mengizinkan **job paralel** — ia
> **tidak** mempercepat satu batch clustering. UMAP/HDBSCAN adalah operasi global atas semua
> embedding dan tak bisa dipartisi tanpa menurunkan kualitas. Percepatan satu-batch nyata
> butuh GPU (CUDA InsightFace, opsional cuML). Deteksi wajah sudah diparalelkan via
> `ThreadPoolExecutor`.

## Pipeline ML dua tahap

`src/pipeline.py:run_full_pipeline(photo_paths, progress_callback)` mengembalikan dict
`{clusters, noise_faces, metrics, face_stats}`. Progress dilaporkan murni lewat
`progress_callback(pct, msg)` (tahap wajah 0–50%, clustering 50–100%).

1. **Deteksi wajah + embedding** — `src/face_extractor.py:process_all_photos`. InsightFace
   `buffalo_l` dimuat sekali via singleton `load_model()` (utamakan CUDA, fallback CPU).
   Baca gambar dengan PIL, downscale ke `MAX_IMAGE_INPUT_SIZE`, crop wajah. Mengembalikan
   list datar berisi dict wajah + statistik. Foto diproses lintas `ThreadPoolExecutor`.
2. **Clustering** — `src/clustering.py:run_clustering_pipeline`. UMAP (cosine, parameter
   tetap dari NB09) lalu HDBSCAN dengan `min_cluster_size`/`min_samples` adaptif. Label
   `-1` = noise. Mengembalikan `clusters` (dict `cluster_id → [faces]`, ter-sortir terbesar
   dulu), `noise_faces`, dan `metrics`.

### Kontrak data antar tahap

Dict **wajah** adalah kontrak yang dijaga utuh sepanjang pipeline:

| Key | Fungsi |
|-----|--------|
| `embedding` | Input clustering. |
| `crop` | Byte gambar untuk thumbnail/ZIP. |
| `source_photo` | Path foto asal (untuk grouping & download). |
| `det_score` | Skor deteksi (memilih wajah representatif). |

## Sumber input

- **Upload** — `src/utils.py:save_uploaded_files(files, output_dir=...)`. Menangani gambar
  lepas & ZIP (guard Zip-Slip), konversi HEIC→JPG, paralel. API membungkus byte
  `UploadFile` dalam `_UploadAdapter` (`.name` + `.getbuffer()`) agar fungsi ini dipakai
  ulang tanpa diubah. `output_dir` per-job (`JobState.photo_dir`).
- **Google Drive** — `src/drive_handler.py:download_from_drive(link, output_dir=, ...)`.
  Listing folder rekursif via Drive API v3, unduh paralel, deteksi halaman konfirmasi
  file besar dari byte awal. Butuh `GOOGLE_API_KEY`.

## Pengiriman gambar (pengganti base64 Streamlit)

Backend menyajikan gambar sebagai endpoint JPEG; tag `<img loading="lazy">` di React
menunjuk ke sana. `JobState.photo_index` memetakan `photo_id` global → path sumber.
Endpoint: `clusters/{cid}/thumb` (crop wajah representatif), `photos/{photo_id}` (foto
penuh via `src/utils.py:load_full_photo`), `noise/{idx}/thumb`, dan `download?cids=` (ZIP).

## Konfigurasi & tuning

`src/config.py` adalah satu-satunya sumber kebenaran untuk hyperparameter & limit. Nilai
UMAP dan parameter HDBSCAN bucket terbesar adalah konstanta tuned NB09 — ubah dengan
sengaja. File temporer di bawah `TEMP_DIR`; foto per-job di `TEMP_DIR/jobs/<job_id>`.

## Frontend (pasca-redesign Juni 2026)

`frontend/src/`:
- `api/client.ts` — wrapper fetch + URL builder + `API_URL` dari `VITE_API_URL`.
- `pages/` — `Overview` (landing one-page lengkap dengan Hero upload fungsional),
  `Processing` (SSE via `EventSource`), `Results`.
- `components/landing/` — `Navbar`, `HeroUpload`, `HowItWorks`, `OutputPreview`,
  `Features`, `FAQ`, `CtaFooter` (port dari `FotoQu website design/`, teks Indonesia).
- `components/` — `ProcessHeader`, `ProgressBar`, `Metric`, `ClusterCard`.

Routing `react-router-dom`: `/` (landing), `/processing/:jobId`, `/results/:jobId`,
`*` → redirect `/`. Upload terjadi langsung di Hero landing; tombol "Mulai memilah"
memanggil `uploadFiles`/`startDriveJob` lalu navigasi ke `/processing/:jobId`.
