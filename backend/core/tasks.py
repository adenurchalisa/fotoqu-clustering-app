"""Runner pipeline yang berjalan di background (threadpool).

Memanggil src.* dan meng-update JobState lewat progress_callback. Tidak ada Streamlit.
"""
import logging

from src.pipeline import run_full_pipeline
from src.utils import save_uploaded_files
from src.drive_handler import download_from_drive
from core.job_store import (
    JobState,
    build_photo_index,
    STATUS_DONE,
    STATUS_EMPTY,
    STATUS_ERROR,
)

logger = logging.getLogger(__name__)


def _set(job: JobState, pct: int, msg: str) -> None:
    job.progress_pct = pct
    job.message = msg


def run_upload_job(job: JobState, files: list) -> None:
    """files: list objek dengan .name & .getbuffer() (lihat api/jobs.py:UploadAdapter)."""
    try:
        _set(job, 0, "Menyimpan file...")
        photo_paths = save_uploaded_files(files, output_dir=job.photo_dir)
        if not photo_paths:
            job.status = STATUS_ERROR
            job.error = "Tidak ada foto valid yang ditemukan."
            _set(job, 100, job.error)
            return
        _run_pipeline(job, photo_paths)
    except Exception as e:  # noqa: BLE001
        _fail(job, e)


def run_drive_job(job: JobState, link: str) -> None:
    try:
        _set(job, 0, "Menghubungi Google Drive...")

        def dl_progress(current, total, filename):
            # Fase unduh dipetakan ke 0-100 dulu; pipeline akan menimpa setelahnya.
            pct = int(current / total * 100) if total else 0
            _set(job, pct, f"Mengunduh {current}/{total}: {filename}")

        photo_paths, error = download_from_drive(
            link, output_dir=job.photo_dir, progress_callback=dl_progress
        )
        if error:
            job.status = STATUS_ERROR
            job.error = error
            _set(job, 100, error)
            return
        if not photo_paths:
            job.status = STATUS_ERROR
            job.error = "Tidak ada foto yang ditemukan di link tersebut."
            _set(job, 100, job.error)
            return
        _run_pipeline(job, photo_paths)
    except Exception as e:  # noqa: BLE001
        _fail(job, e)


def _run_pipeline(job: JobState, photo_paths: list) -> None:
    def progress(pct, msg):
        _set(job, pct, msg)

    result = run_full_pipeline(photo_paths, progress_callback=progress)

    job.face_stats = result["face_stats"]

    if not result["clusters"]:
        job.status = STATUS_EMPTY
        _set(job, 100, "Tidak ada wajah terdeteksi.")
        return

    job.clusters = result["clusters"]
    job.noise_faces = result["noise_faces"]
    job.metrics = result["metrics"]
    build_photo_index(job)

    job.status = STATUS_DONE
    _set(job, 100, "Selesai!")


def _fail(job: JobState, e: Exception) -> None:
    logger.error("Job %s gagal: %s", job.job_id, e, exc_info=True)
    job.status = STATUS_ERROR
    job.error = str(e)
    _set(job, 100, f"Error: {e}")
