# Redesign UI besar — Juni 2026

Catatan rencana redesign UI yang **sudah dieksekusi**, lengkap dengan konteks, pertanyaan
klarifikasi yang dilempar ke user beserta jawabannya, dan ringkasan perubahan.

## Konteks

Frontend lama memakai tema seadanya (cream/sand/ink, emoji, tanpa animasi) dengan UI
berbeda di tiap halaman. User membuat **desain acuan** dengan Figma Make di folder
`FotoQu website design/` dan menjadikannya **referensi utama & final**.

Referensi pada dasarnya adalah **landing one-page**: Navbar → Hero+Upload → HowItWorks →
OutputPreview → Features → FAQ → CtaFooter, di mana kartu upload & tombol "Sort my photos"
hanya **simulasi** (tidak terhubung backend).

Tujuan: redesign frontend agar **persis** mengikuti design system referensi (warna, font,
layout, animasi), sambil **mempertahankan seluruh wiring backend yang sudah jalan**
(upload, SSE progress, clusters, download).

## Pertanyaan yang dilempar ke user & jawabannya

Sebelum eksekusi, tiga keputusan diklarifikasi lewat pertanyaan:

1. **Alur proses — di mana upload nyata terjadi?**
   - Pilihan A *(dipilih)*: **Upload tetap di Hero.** Kartu upload di Hero dibuat
     benar-benar fungsional (memanggil backend), lalu transisi ke layar Processing →
     Results yang didesain ulang dengan style sama.
   - Pilihan B: Landing murni marketing; tombol aksi membuka halaman upload terpisah.

2. **Bahasa teks** — referensi seluruhnya Inggris, tapi konvensi proyek (CLAUDE.md) minta
   Bahasa Indonesia.
   - Jawaban *(dipilih)*: **Bahasa Indonesia.** Pertahankan layout/style persis referensi,
     terjemahkan semua copy.

3. **Dependency** — referensi pakai `motion` (animasi) + `lucide-react` (ikon); app lama
   tak punya keduanya.
   - Jawaban *(dipilih)*: **Tambahkan keduanya** agar hasil persis. Tailwind tetap v3
     (komponen referensi pakai inline-style + utility layout → kompatibel).

### Klarifikasi tambahan dari user

> "jadi cara kerja website ketika user mengunjunginya itu seperti ilovepdf atau iloveimg
> begitu yang bisa langsung upload kan?"

Dikonfirmasi **ya**: begitu situs dibuka, kartu upload langsung ada di Hero (tanpa akun,
tanpa pindah halaman). Bedanya hanya tahap setelah submit — karena clustering butuh waktu,
user dibawa ke layar Processing (progress real-time) lalu Results. Dua layar itu memakai
design system identik.

## Design system (sumber: `FotoQu website design/src/styles/theme.css`)

- **Warna:** bg `#F7F5F0`, ink/foreground `#141210`, card `#FFFFFF`, secondary/muted-bg
  `#EDEAE3`, muted-text `#7A7570` / `#A09A93`, **accent `#C9843A`**, footer-dark `#0E0C0A`,
  section-dark `#141210`. Border `rgba(20,18,16,0.08–0.12)`.
- **Font:** DM Serif Display (judul, italic untuk highlight accent), Inter (body/UI,
  300–600), DM Mono (label kecil/metadata). Radius dasar `0.625rem`.
- **Pola:** heading serif `clamp()`, eyebrow DM Mono uppercase accent, kartu rounded-2xl
  border halus, hover via inline `onMouseEnter/Leave`, animasi `motion`.

## Ringkasan perubahan (yang dikerjakan)

### Setup
- `frontend/package.json` — tambah `motion` + `lucide-react`.
- `frontend/index.html` — font: DM Serif Display (+italic), Inter 300–600, DM Mono.
- `frontend/tailwind.config.js` + `src/index.css` — palette FotoQu baru + `font-mono`.
  Alias lama (`cream/sand/sandborder`) dipertahankan sebagai jaring pengaman transisi.

### Landing (port referensi → Indonesia)
- Baru: `frontend/src/components/landing/{Navbar,HeroUpload,HowItWorks,OutputPreview,Features,FAQ,CtaFooter}.tsx`.
- `pages/Overview.tsx` di-repurpose menyusun semua section sebagai landing one-page.
- **HeroUpload fungsional**: tab File ZIP / Foto / Link Drive → `uploadFiles` /
  `startDriveJob` → `navigate('/processing/:jobId')`. Simulasi progress 65% dihapus.

### Layar proses (redesign, logika dipertahankan)
- `pages/Processing.tsx` — logika `EventSource` + fallback `getJobStatus` + auto-navigate
  **tidak diubah**; hanya tampilan (spinner accent, ProgressBar motion, state empty/error
  ikon lucide).
- `pages/Results.tsx`, `components/{ClusterCard,Metric,ProgressBar}.tsx` — restyle ke
  design system; semua call API & state `selected` dipertahankan.
- Baru: `components/ProcessHeader.tsx` (logo + link "← Beranda").

### Shell & routing
- `App.tsx` — hapus `TopNav` global + wrapper `<main>`; tiap route full-bleed. Route
  `/upload` dihapus (upload pindah ke Hero); `*` → redirect `/`.

### Dihapus
- `pages/Upload.tsx`, `components/TopNav.tsx`.

### Tidak disentuh
- `api/client.ts`, `types.ts`, dan seluruh `backend/`.

## Verifikasi

- `npm run build` (tsc -b + vite build) lolos bersih.
- Preview `localhost:5173`: landing render dengan font & palet benar; struktur lengkap
  (section `upload`/`cara-kerja`/`fitur`/`faq`, 3 tab + tombol submit). Console hanya
  warning future-flag React Router v6→v7 (sudah ada sebelumnya, tak berbahaya).
- Uji end-to-end nyata (upload → cluster → download) memerlukan backend berjalan
  (`cd backend && uvicorn main:app --reload`).
