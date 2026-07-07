# 📚 Dokumentasi FotoQu

Folder ini menyimpan **catatan perencanaan, keputusan desain, batasan, dan pertanyaan
klarifikasi** yang muncul selama pengembangan FotoQu. Tujuannya agar konteks "kenapa
sesuatu dibuat begini" tidak hilang dan mudah ditelusuri kembali.

> Untuk dokumentasi penggunaan & cara menjalankan, lihat [`../README.md`](../README.md).

## Daftar isi

| Dokumen | Isi |
|---------|-----|
| [`architecture.md`](architecture.md) | Alur sistem end-to-end, pipeline ML dua tahap, layering backend, kontrak data antar tahap. |
| [`ui-redesign-2026-06.md`](ui-redesign-2026-06.md) | Rencana redesign UI besar (Juni 2026) yang dieksekusi: konteks, keputusan, pertanyaan yang dilempar ke user + jawabannya, file yang disentuh, verifikasi. |
| [`decisions.md`](decisions.md) | Log keputusan ringkas (ADR-style): apa yang diputuskan, alasan, dan alternatif yang ditolak. |
| [`constraints-and-open-questions.md`](constraints-and-open-questions.md) | Batasan teknis/produk yang diketahui + pertanyaan terbuka yang belum dijawab. |

## Konvensi

- Bahasa dokumen & teks user-facing: **Bahasa Indonesia**; pesan commit: **Inggris**.
- Tanggal ditulis absolut (mis. "27 Juni 2026"), bukan relatif.
- Setiap keputusan penting sebaiknya dicatat di `decisions.md` dengan format singkat.
