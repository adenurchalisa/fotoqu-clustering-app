# 📸 FotoQu / FaceCluster

Aplikasi web untuk mendeteksi wajah pada kumpulan foto dan mengelompokkannya
secara otomatis berdasarkan orang. Sumber foto bisa dari upload langsung (gambar
atau ZIP) atau folder Google Drive publik. Hasilnya berupa cluster per-orang yang
bisa diunduh sebagai ZIP berstruktur folder.

Arsitektur **terpisah**:
- **Backend** — FastAPI (`backend/`) yang mengekspos pipeline ML sebagai HTTP API,
  menjalankan job secara async dengan progress lewat Server-Sent Events (SSE).
- **Frontend** — React + Vite + Tailwind (`frontend/`), SPA yang memanggil API.

## Persyaratan
- Python 3.10+
- Node.js 18+ (untuk frontend)
- (Opsional) `GOOGLE_API_KEY` — hanya untuk fitur download dari Google Drive

## Backend (FastAPI)

```bash
# 1. Buat & aktifkan virtual environment
python -m venv venv
venv\Scripts\Activate.ps1        # Windows PowerShell
# source venv/Scripts/activate   # Windows Git Bash
# source venv/bin/activate       # macOS / Linux

# 2. Install dependency
pip install -r backend/requirements.txt

# 3. (Opsional) konfigurasi Google Drive — salin template lalu isi key
#    backend/.env.example  →  backend/.env

# 4. Jalankan API (dari dalam folder backend/)
cd backend
uvicorn main:app --reload        # http://localhost:8000  (docs: /docs)
```

Di Linux, dependency sistem untuk OpenCV ada di `backend/packages.txt`
(`libgl1-mesa-glx`, `libglib2.0-0`).

## Frontend (React + Tailwind)

```bash
cd frontend
npm install
# (opsional) salin .env.example → .env bila backend bukan di http://localhost:8000
npm run dev                      # http://localhost:5173
```

Buka http://localhost:5173 di browser. Pastikan backend sudah berjalan.

## Konfigurasi Google Drive (opsional)
Fitur download dari Google Drive butuh `GOOGLE_API_KEY`. Set lewat file
`backend/.env` (di-gitignore):

```
GOOGLE_API_KEY=...
```

Cara mendapatkan key: Google Cloud Console → buat project → enable
**Google Drive API** → Credentials → Create API Key.

## Alur pakai
1. **Upload** foto / ZIP, atau tempel link folder Google Drive (*Anyone with the link*).
2. **Processing** — backend mendeteksi wajah (InsightFace) lalu clustering
   (UMAP + HDBSCAN); frontend menampilkan progress real-time via SSE.
3. **Hasil** — galeri cluster per orang (render bertahap + lazy-load), unduh
   per-cluster atau batch sebagai ZIP. Tombol download aktif setelah proses selesai.

## Catatan arsitektur
- Pipeline ML (face detection + clustering) berjalan sebagai **job async** di
  background; HTTP request langsung balas `job_id`. Async di sini membuat server
  responsif & bisa memproses banyak job paralel — **bukan** mempercepat satu batch
  clustering (UMAP/HDBSCAN bersifat global; untuk percepatan nyata gunakan GPU).
- State job disimpan in-memory (cukup untuk single-instance). Untuk multi-instance,
  ganti `backend/core/job_store.py` dengan Redis/DB.

## Kontribusi
Gunakan **Conventional Commits**, buat commit **atomik** dan kecil, tulis pesan
commit dalam **bahasa Inggris**.
