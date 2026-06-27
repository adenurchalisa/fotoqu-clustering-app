import logging
from src.face_extractor import process_all_photos
from src.clustering import run_clustering_pipeline

logger = logging.getLogger(__name__)


def run_full_pipeline(photo_paths, progress_callback=None):
    """
    Jalankan pipeline lengkap (deteksi wajah → clustering).

    progress_callback(pct, msg) dipanggil dengan persen 0-100 dan pesan status.
    Tahap deteksi wajah memetakan ke 0-50%, clustering ke 50-100%.

    Return: dict {
        "clusters", "noise_faces", "metrics", "face_stats"
    }. Jika tidak ada wajah terdeteksi, "clusters"/"noise_faces"/"metrics" None.
    """
    def report(pct, msg):
        if progress_callback:
            progress_callback(pct, msg)

    report(0, "Memulai...")

    # STEP 1: Face Detection & Embedding (0-50%)
    def face_progress(current, total, msg):
        report(int((current / total) * 50), msg)

    all_faces, face_stats = process_all_photos(photo_paths, face_progress)

    if not all_faces:
        report(100, "Tidak ada wajah terdeteksi!")
        return {
            "clusters": None,
            "noise_faces": None,
            "metrics": None,
            "face_stats": face_stats,
        }

    # STEP 2: UMAP + HDBSCAN (50-100%)
    def cluster_progress(current, total, msg):
        report(50 + int((current / total) * 50), msg)

    clusters, noise_faces, metrics = run_clustering_pipeline(all_faces, cluster_progress)

    report(100, "Selesai!")
    return {
        "clusters": clusters,
        "noise_faces": noise_faces,
        "metrics": metrics,
        "face_stats": face_stats,
    }
