"""
Hyperparameter dari hasil eksperimen NB09-NB11 (LOF + UMAP + HDBSCAN Two-Pass + GLOSH).

Konfigurasi terbaik (NB11 - Skenario E):
  Coverage Rate    : 99.6%
  ARI              : 0.9609
  Purity           : 0.9987
  n_clusters       : 139

Grid search optimal dari NB10 (UMAP 30-dim, LOF-filtered):
  mcs=15, ms=10, DBCV=0.8391, coverage=97.0%
"""

import os

# Muat variabel dari file .env bila ada (opsional — tidak wajib untuk fitur upload)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Google Drive API
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

# InsightFace
FACE_MODEL_NAME      = "buffalo_l"
FACE_DET_SIZE        = (640, 640)
FACE_DET_THRESHOLD   = 0.5
FACE_PADDING         = 0.1
FACE_MIN_CROP_SIZE   = 20
MAX_IMAGE_INPUT_SIZE = 1920  # Resize foto besar ke max dimensi ini sebelum deteksi (speedup)

# LOF — filter false detection sebelum UMAP (embedding space, bukan pixel space)
LOF_N_NEIGHBORS   = 20
LOF_CONTAMINATION = 0.03   # flagging 3% teratas sebagai outlier; skip jika n < LOF_N_NEIGHBORS + 5

# UMAP — konfigurasi dari grid search NB10 (n_neighbors=15 optimal vs 30 sebelumnya)
UMAP_N_COMPONENTS = 30
UMAP_N_NEIGHBORS  = 15     # optimal dari grid search NB10 (was 30)
UMAP_MIN_DIST     = 0.0
UMAP_RANDOM_STATE = 42

# HDBSCAN Pass 1 — parameter optimal dari grid search NB10 (mcs=15, ms=10, DBCV=0.8391)
HDBSCAN_CLUSTER_SELECTION_METHOD = "eom"
HDBSCAN_MCS_PASS1 = 15     # optimal untuk dataset >= 200 wajah
HDBSCAN_MS_PASS1  = 10     # optimal dari grid search

# HDBSCAN Pass 2 — re-cluster noise dari Pass 1 dengan parameter lebih longgar
HDBSCAN_MCS_PASS2 = 2
HDBSCAN_MS_PASS2  = 1

# GLOSH — density-based outlier score dari clusterer Pass 1 (range 0–1)
GLOSH_THRESHOLD = 0.9      # titik dengan score > 0.9 → outlier permanen, tidak di-assign

# approximate_predict strength threshold
STRENGTH_MIN = 0.1         # wajah dengan strength < 0.1 → tetap noise (singleton)

# App limits
MAX_PHOTOS_UPLOAD = 3000
SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".heic", ".heif"]
TEMP_DIR          = os.path.join(os.getenv("TMPDIR", os.getenv("TEMP", "/tmp")), "facecluster")

# UI
MAX_CLUSTER_PREVIEW     = 200   # batas absolut foto/cluster saat "tampilkan semua"
GALLERY_PREVIEW_INITIAL = 24    # foto yang ditampilkan awal per cluster (sebelum "tampilkan semua")
GALLERY_THUMB_MAX_DIM   = 512   # downscale foto galeri sebelum di-embed base64 (jaga ukuran HTML)
GALLERY_JPEG_QUALITY    = 80    # kualitas JPEG untuk embed base64
MAX_NOISE_PREVIEW       = 12

