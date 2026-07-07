# 📸 FotoQu / FaceCluster

Aplikasi web untuk **mendeteksi wajah** pada kumpulan foto dan **mengelompokkannya
secara otomatis berdasarkan orang**. Cocok untuk merapikan foto acara besar (reuni,
pernikahan, wisuda) atau koleksi foto bertahun-tahun yang campur aduk.

Sumber foto bisa dari **upload langsung** (banyak gambar atau satu file ZIP) atau
**folder Google Drive publik**. Hasilnya berupa **cluster per-orang** yang bisa diunduh
sebagai ZIP berstruktur folder (satu folder per orang).

> Cara pakai mirip iLovePDF/iLoveIMG: begitu membuka situs, kartu upload langsung
> tersedia di Hero halaman depan — tanpa akun, tanpa pindah halaman dulu.

---

## ✨ Fitur

- **Pengelompokan wajah akurat** — InsightFace `buffalo_l` (deteksi + embedding) lalu
  clustering UMAP + HDBSCAN; tahan terhadap perbedaan usia, pencahayaan, dan sudut.
- **Tiga sumber input** — banyak foto sekaligus, arsip ZIP, atau link Google Drive publik.
- **Progress real-time** — job berjalan async di backend, progress di-stream ke browser
  via Server-Sent Events (SSE).
- **Output rapi** — unduh per-cluster atau batch beberapa cluster sebagai satu ZIP
  berstruktur folder.
- **Privasi** — foto hanya diproses sementara di folder per-job, tidak disimpan permanen.

---

## 🧱 Tech stack

| Lapisan       | Teknologi |
|---------------|-----------|
| **Frontend**  | React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6, `motion` (animasi), `lucide-react` (ikon) |
| **Backend**   | Python, FastAPI, Uvicorn, Server-Sent Events (SSE), BackgroundTasks |
| **ML / CV**   | InsightFace (`buffalo_l`) + ONNX Runtime, UMAP (`umap-learn`), HDBSCAN, scikit-learn, NumPy |
| **Gambar/IO** | Pillow, pillow-heif (HEIC→JPG), OpenCV (headless) |
| **Drive**     | `google-api-python-client` (Google Drive API v3) |
| **Desain**    | Design system dari `FotoQu website design/` (Figma Make) — DM Serif Display, Inter, DM Mono; palet cream/ink/accent bronze |

---

## 🗺️ Arsitektur & alur sistem

Aplikasi dipisah menjadi dua bagian independen: **`backend/`** (API + pipeline ML) dan
**`frontend/`** (SPA). Frontend tidak pernah menjalankan ML — ia hanya memanggil API.

```
┌────────────────┐        1. POST /api/jobs/upload | /drive         ┌──────────────────────┐
│                │ ───────────────────────────────────────────────▶ │  FastAPI (backend/)  │
│  Browser SPA   │        ◀── { job_id }                            │                      │
│  (frontend/)   │                                                  │  BackgroundTasks ─┐  │
│                │        2. GET /api/jobs/{id}/progress  (SSE)      │                   ▼  │
│  Hero upload   │ ◀═══════════════ progress %, status ════════════ │   Pipeline ML        │
│   → Processing │                                                  │  ┌────────────────┐  │
│   → Results    │        3. GET /clusters, /thumb, /photos          │  │ 1. Deteksi+     │  │
│                │ ───────────────────────────────────────────────▶ │  │    embedding    │  │
│                │        4. GET /download?cids=…  (ZIP)             │  │   (InsightFace) │  │
│                │ ◀═══════════════════════════════════════════════ │  │ 2. Clustering   │  │
└────────────────┘                                                  │  │   (UMAP+HDBSCAN)│  │
                                                                    │  └────────────────┘  │
                                                                    └──────────────────────┘
```

**Alur pengguna (frontend):**
1. **Landing (`/`)** — kartu upload ada langsung di Hero. Pilih ZIP / banyak foto / link
   Drive lalu tekan **"Mulai memilah"**.
2. **Processing (`/processing/:jobId`)** — berlangganan SSE, menampilkan progress;
   otomatis pindah ke hasil saat selesai.
3. **Results (`/results/:jobId`)** — metrik + galeri cluster per orang (lazy-load saat
   di-expand), unduh per-cluster atau batch.

**Alur job (backend):** request `POST` membuat `JobState`, menjadwalkan pekerjaan lewat
`BackgroundTasks`, dan langsung mengembalikan `job_id`. Pipeline berjalan dua tahap:
**(1)** deteksi wajah + embedding (`src/face_extractor.py`, paralel via `ThreadPoolExecutor`),
**(2)** clustering UMAP→HDBSCAN (`src/clustering.py`). Progress dilaporkan lewat
`progress_callback` (tahap wajah 0–50%, clustering 50–100%).

Lebih detail: lihat [`docs/architecture.md`](docs/architecture.md).

### Endpoint API utama

| Method | Path | Kegunaan |
|--------|------|----------|
| `POST` | `/api/jobs/upload` | Upload foto/ZIP → `{ job_id }` |
| `POST` | `/api/jobs/drive` | Job dari link Google Drive → `{ job_id }` |
| `GET`  | `/api/jobs/{id}` | Status job (fallback polling) |
| `GET`  | `/api/jobs/{id}/progress` | Stream progress (SSE) |
| `GET`  | `/api/jobs/{id}/clusters` | Metrik + daftar cluster |
| `GET`  | `/api/jobs/{id}/clusters/{cid}/thumb` | Crop wajah representatif (JPEG) |
| `GET`  | `/api/jobs/{id}/clusters/{cid}/photos` | Daftar foto dalam cluster |
| `GET`  | `/api/jobs/{id}/photos/{photo_id}` | Foto penuh (JPEG) |
| `GET`  | `/api/jobs/{id}/noise/{idx}/thumb` | Crop wajah tak terkelompok |
| `GET`  | `/api/jobs/{id}/download?cids=1,2` | Unduh cluster terpilih sebagai ZIP |

Dokumentasi interaktif tersedia di `http://localhost:8000/docs` (Swagger UI).

---

## 📂 Struktur folder

```
photo-clustering-app/
├── backend/
│   ├── src/          # Logika ML/IO murni, bebas framework web (pipeline, clustering, dll.)
│   ├── core/         # Glue runtime: job_store (JOBS in-memory) + tasks (background runner)
│   ├── api/          # Router FastAPI: jobs.py, results.py
│   ├── main.py       # App factory: load model saat startup, CORS, include routers
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/            # Overview (landing), Processing, Results
│       ├── components/       # ProcessHeader, ProgressBar, Metric, ClusterCard
│       │   └── landing/      # Navbar, HeroUpload, HowItWorks, OutputPreview, Features, FAQ, CtaFooter
│       └── api/client.ts     # Wrapper fetch + URL builder ke backend
├── FotoQu website design/    # Referensi desain (Figma Make) — acuan design system
├── docs/                     # Perencanaan, log keputusan, batasan, & catatan
└── README.md
```

---

## 🚀 Cara menjalankan

**Persyaratan:** Python 3.10+, Node.js 18+, dan (opsional) `GOOGLE_API_KEY` untuk fitur Drive.

### 1. Backend (FastAPI)

```bash
# Buat & aktifkan virtual environment
python -m venv venv
venv\Scripts\Activate.ps1          # Windows PowerShell
# source venv/Scripts/activate     # Windows Git Bash
# source venv/bin/activate         # macOS / Linux

# Install dependency
pip install -r backend/requirements.txt

# (Opsional) konfigurasi Google Drive: salin template lalu isi key
#   backend/.env.example  →  backend/.env

# Jalankan API DARI DALAM folder backend/ (modul diimpor sebagai from src..., from core...)
cd backend
uvicorn main:app --reload          # http://localhost:8000  (docs: /docs)
```

Di Linux, dependency sistem untuk OpenCV ada di `backend/packages.txt`
(`libgl1-mesa-glx`, `libglib2.0-0`). Model InsightFace diunduh otomatis saat pertama kali
dijalankan.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
# (opsional) set VITE_API_URL di .env bila backend bukan di http://localhost:8000
npm run dev                        # http://localhost:5173
npm run build                      # tsc -b && vite build (sekaligus type-check / gerbang CI)
```

Buka `http://localhost:5173`, pastikan backend sudah berjalan, lalu upload foto langsung
dari Hero.

---

## ⚙️ Konfigurasi

| Variabel | Lokasi | Default | Fungsi |
|----------|--------|---------|--------|
| `GOOGLE_API_KEY` | `backend/.env` | — (wajib hanya untuk fitur Drive) | Google Drive API v3 key |
| `FRONTEND_ORIGINS` | `backend/.env` | `http://localhost:5173` | Allow-list CORS (pisah koma) |
| `VITE_API_URL` | `frontend/.env` | `http://localhost:8000` | Base URL backend |

Cara mendapatkan `GOOGLE_API_KEY`: Google Cloud Console → buat project → enable
**Google Drive API** → Credentials → Create API Key.

---

## 📝 Catatan arsitektur & batasan

- Pipeline ML berjalan sebagai **job async** di background; request HTTP langsung balas
  `job_id`. Async membuat server responsif & bisa memproses banyak job paralel — **bukan**
  mempercepat satu batch clustering (UMAP/HDBSCAN bersifat global atas semua embedding;
  percepatan nyata satu batch butuh GPU/CUDA).
- State job disimpan **in-memory** (`core/job_store.py`) — cukup untuk single-instance.
  Untuk multi-instance, ganti dengan Redis/DB. Job hilang saat server restart.
- Tidak ada test suite/linter Python. Untuk frontend, `npm run build` menjalankan
  type-checker dan menjadi gerbang CI terdekat.

---

## 📚 Dokumentasi

Catatan perencanaan, log keputusan desain, batasan, dan pertanyaan klarifikasi yang sempat
dibahas tersimpan di folder [`docs/`](docs/):

- [`docs/architecture.md`](docs/architecture.md) — alur sistem & pipeline detail.
- [`docs/ui-redesign-2026-06.md`](docs/ui-redesign-2026-06.md) — rencana redesign UI besar
  (yang dieksekusi) beserta pertanyaan yang dilempar & jawabannya.
- [`docs/decisions.md`](docs/decisions.md) — log keputusan (ADR ringkas).
- [`docs/constraints-and-open-questions.md`](docs/constraints-and-open-questions.md) —
  batasan & pertanyaan terbuka.

---

## 🤝 Kontribusi

Gunakan **Conventional Commits** (`feat:`, `fix:`, `docs:`, …), buat commit **atomik** dan
kecil, tulis pesan commit dalam **bahasa Inggris**. Teks user-facing & komentar kode dalam
**Bahasa Indonesia**.
