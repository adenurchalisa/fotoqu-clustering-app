"""In-memory job store untuk pipeline async.

Cukup untuk deployment single-instance (satu proses uvicorn). Untuk multi-instance,
ganti dict ini dengan Redis/DB. State per-job menyimpan hasil clustering + numpy crop
sampai diunduh, menggantikan st.session_state Streamlit.
"""
import logging
import os
import shutil
import threading
import time
import uuid
from dataclasses import dataclass, field

from src.config import TEMP_DIR
from src.utils import cleanup_temp  # noqa: F401  (dipakai pemanggil lain)

logger = logging.getLogger(__name__)

# Status job
STATUS_RUNNING = "running"
STATUS_DONE = "done"
STATUS_EMPTY = "empty"   # selesai tapi tidak ada wajah terdeteksi
STATUS_ERROR = "error"


@dataclass
class JobState:
    job_id: str
    status: str = STATUS_RUNNING
    progress_pct: int = 0
    message: str = "Antri..."
    error: str = ""

    # Hasil pipeline (diisi saat selesai)
    clusters: dict = None            # cid -> [face dict]
    noise_faces: list = None
    metrics: dict = None
    face_stats: dict = None

    # Pendukung penyajian gambar
    photo_dir: str = ""              # direktori foto sumber milik job ini
    photo_index: list = field(default_factory=list)  # daftar path foto unik (idx = photo_id)
    created_at: float = field(default_factory=time.time)

    def public_status(self) -> dict:
        """Ringkasan status untuk endpoint polling/SSE (tanpa data biner)."""
        data = {
            "job_id": self.job_id,
            "status": self.status,
            "progress_pct": self.progress_pct,
            "message": self.message,
        }
        if self.status == STATUS_ERROR:
            data["error"] = self.error
        if self.status in (STATUS_DONE, STATUS_EMPTY) and self.metrics:
            data["metrics"] = self.metrics
        if self.face_stats:
            data["face_stats"] = self.face_stats
        return data


# Registry global job
JOBS: dict[str, JobState] = {}
_LOCK = threading.Lock()


def new_job() -> JobState:
    job_id = uuid.uuid4().hex[:12]
    job = JobState(job_id=job_id, photo_dir=os.path.join(TEMP_DIR, "jobs", job_id))
    os.makedirs(job.photo_dir, exist_ok=True)
    with _LOCK:
        JOBS[job_id] = job
    return job


def get_job(job_id: str) -> JobState | None:
    return JOBS.get(job_id)


def build_photo_index(job: JobState) -> None:
    """Bangun daftar path foto unik dari hasil clustering (idx jadi photo_id)."""
    seen = []
    seen_set = set()
    sources = []
    if job.clusters:
        for faces in job.clusters.values():
            sources.extend(f["source_photo"] for f in faces)
    for path in sources:
        if path not in seen_set:
            seen_set.add(path)
            seen.append(path)
    job.photo_index = seen


def delete_job(job_id: str) -> bool:
    """Hapus job dari registry dan bersihkan direktori fotonya."""
    with _LOCK:
        job = JOBS.pop(job_id, None)
    if job is None:
        return False
    if job.photo_dir and os.path.exists(job.photo_dir):
        shutil.rmtree(job.photo_dir, ignore_errors=True)
    return True


def cleanup_expired(max_age_seconds: int = 3600) -> int:
    """Hapus job yang lebih tua dari max_age_seconds. Return jumlah yang dihapus."""
    now = time.time()
    expired = [jid for jid, j in list(JOBS.items()) if now - j.created_at > max_age_seconds]
    for jid in expired:
        delete_job(jid)
    return len(expired)
