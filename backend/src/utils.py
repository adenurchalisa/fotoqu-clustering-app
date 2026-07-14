import logging
import os
import io
import zipfile
import shutil
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor, as_completed
import cv2
from PIL import Image
import numpy as np
from src.config import TEMP_DIR, SUPPORTED_FORMATS, MAX_PHOTOS_UPLOAD, GALLERY_THUMB_MAX_DIM

logger = logging.getLogger(__name__)

HEIC_FORMATS = (".heic", ".heif")
UPLOAD_MAX_WORKERS = 8


def _write_regular_file(f, output_dir):
    """Tulis satu file upload (biasa atau HEIC) ke disk. Return: path foto, atau None."""
    path = os.path.join(output_dir, f.name)
    with open(path, "wb") as out:
        out.write(f.getbuffer())

    if f.name.lower().endswith(HEIC_FORMATS):
        return convert_heic_to_jpg(path)
    return path


def _extract_zip_entry(zip_bytes, entry, output_dir, output_dir_real):
    """Ekstrak satu entry ZIP ke disk. Return: path foto, atau None.

    `output_dir_real` harus sudah di-realpath() SEKALI oleh pemanggil, dan semua
    subfolder tujuan harus sudah dibuat SEBELUM dispatch paralel (lihat
    save_uploaded_files) — os.path.realpath() pada Windows bisa memberi hasil
    berbeda sesaat untuk path yang folder induknya sedang dibuat oleh thread lain
    secara bersamaan, yang membuat guard Zip Slip di bawah salah membuang file
    (silent, tanpa exception)."""
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        # Guard: Zip Slip protection
        safe_path = os.path.realpath(os.path.join(output_dir, entry))
        if not safe_path.startswith(output_dir_real):
            return None

        extracted = zf.extract(entry, output_dir)

    if entry.lower().endswith(HEIC_FORMATS):
        return convert_heic_to_jpg(extracted)
    return extracted


def save_uploaded_files(uploaded_files, output_dir=None):
    """Simpan file upload user ke direktori temporer (paralel). Return: list of photo paths.

    `output_dir` opsional — beri direktori per-job agar upload antar-job tidak bercampur.
    Tiap file harus punya atribut `.name` dan method `.getbuffer()` (bytes-like)."""
    if output_dir is None:
        output_dir = os.path.join(TEMP_DIR, "uploads")
    os.makedirs(output_dir, exist_ok=True)
    output_dir_real = os.path.realpath(output_dir)

    tasks = []
    n_planned = 0

    for f in uploaded_files:
        if n_planned >= MAX_PHOTOS_UPLOAD:
            break

        name_lower = f.name.lower()

        if name_lower.endswith(".zip"):
            zip_bytes = bytes(f.getbuffer())
            with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
                entries = []
                for entry in zf.namelist():
                    if n_planned >= MAX_PHOTOS_UPLOAD:
                        break
                    if not any(entry.lower().endswith(ext) for ext in SUPPORTED_FORMATS):
                        continue
                    entries.append(entry)
                    n_planned += 1

            # Buat semua subfolder tujuan SEBELUM dispatch paralel — realpath() di
            # Windows bisa memberi hasil tidak konsisten untuk folder yang sedang
            # dibuat bersamaan oleh thread lain (lihat docstring _extract_zip_entry).
            subdirs = {os.path.dirname(os.path.join(output_dir, e)) for e in entries}
            for d in subdirs:
                os.makedirs(d, exist_ok=True)

            for entry in entries:
                tasks.append((_extract_zip_entry, (zip_bytes, entry, output_dir, output_dir_real)))

        elif any(name_lower.endswith(ext) for ext in SUPPORTED_FORMATS):
            tasks.append((_write_regular_file, (f, output_dir)))
            n_planned += 1

    photo_paths = []
    with ThreadPoolExecutor(max_workers=UPLOAD_MAX_WORKERS) as executor:
        futures = [executor.submit(fn, *args) for fn, args in tasks]
        for future in as_completed(futures):
            try:
                result = future.result()
                if result:
                    photo_paths.append(result)
            except Exception as e:
                logger.warning("Gagal menyimpan file upload: %s", e)

    return photo_paths


def convert_heic_to_jpg(heic_path):
    """Konversi file HEIC/HEIF ke JPG. Return: path JPG baru, atau None jika gagal."""
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()

        img = Image.open(heic_path)
        jpg_path = os.path.splitext(heic_path)[0] + ".jpg"
        img.convert("RGB").save(jpg_path, "JPEG", quality=95)

        os.remove(heic_path)
        return jpg_path
    except Exception as e:
        logger.warning("Gagal konversi HEIC '%s': %s", heic_path, e)
        return None


def _cluster_signature(clusters, selected_ids):
    """Signature ringan & hashable dari cluster terpilih, dipakai sebagai cache key
    (hindari hash langsung atas numpy array crop/embedding yang besar)."""
    return tuple(
        (cid, tuple((f["source_photo"], round(f["det_score"], 4)) for f in clusters.get(cid, [])))
        for cid in selected_ids
    )


# Cache bytes ZIP terakhir per-signature (bounded). Menggantikan @st.cache_data Streamlit.
# Menyimpan bytes (bukan BytesIO) agar tiap pemanggil dapat buffer baru — cursor tidak tabrakan.
_ZIP_CACHE = {}
_ZIP_CACHE_MAX = 16


def _build_cluster_zip(clusters, selected_ids):
    """
    Buat ZIP dari cluster yang dipilih, return: bytes.
    Struktur: Cluster_1/foto1.jpg, Cluster_2/foto2.jpg, ... + Cluster_N/_preview.jpg
    """
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for cid in selected_ids:
            if cid not in clusters:
                continue

            folder_name = f"Cluster_{cid + 1}"
            faces = clusters[cid]

            if not faces:
                continue

            # Tambah _preview.jpg — wajah representatif (skor deteksi tertinggi)
            rep_face = max(faces, key=lambda f: f["det_score"])
            preview_buf = io.BytesIO()
            numpy_to_pil(rep_face["crop"]).save(preview_buf, "JPEG", quality=90)
            zf.writestr(f"{folder_name}/_preview.jpg", preview_buf.getvalue())

            # Tambah foto asli (unik)
            added_photos = set()
            for face in faces:
                photo_path = face["source_photo"]
                if photo_path in added_photos:
                    continue
                added_photos.add(photo_path)

                filename = os.path.basename(photo_path)
                arcname = f"{folder_name}/{filename}"
                zf.write(photo_path, arcname)

    return zip_buffer.getvalue()


def create_cluster_zip(clusters, selected_ids):
    """Wrapper publik — bangun signature ringan sebagai cache key, return BytesIO siap dikirim."""
    selected_ids = tuple(selected_ids)
    signature = _cluster_signature(clusters, selected_ids)

    data = _ZIP_CACHE.get(signature)
    if data is None:
        data = _build_cluster_zip(clusters, selected_ids)
        if len(_ZIP_CACHE) >= _ZIP_CACHE_MAX:
            _ZIP_CACHE.pop(next(iter(_ZIP_CACHE)))
        _ZIP_CACHE[signature] = data

    return io.BytesIO(data)


def numpy_to_pil(img_array):
    """Convert numpy array RGB ke PIL Image."""
    return Image.fromarray(img_array.astype(np.uint8))


def load_full_photo(path, max_dim=GALLERY_THUMB_MAX_DIM):
    """Baca foto penuh sebagai PIL Image (RGB), dengan downscale untuk preview.
    Dipindah dari komponen Streamlit lama; dipakai endpoint gambar backend."""
    img = cv2.imread(path)
    if img is None:
        return None
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        new_w = max(1, int(round(w * scale)))
        new_h = max(1, int(round(h * scale)))
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return numpy_to_pil(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))


def cleanup_temp():
    """Hapus semua file temporer."""
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR, ignore_errors=True)