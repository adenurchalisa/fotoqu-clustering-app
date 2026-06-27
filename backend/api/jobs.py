"""Endpoint job: upload / Google Drive / status / progress (SSE)."""
import asyncio
import json
import logging

from fastapi import APIRouter, BackgroundTasks, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core import tasks
from core.job_store import new_job, get_job, delete_job, STATUS_RUNNING

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class _UploadAdapter:
    """Bungkus byte upload agar kompatibel dengan src.utils.save_uploaded_files
    (butuh atribut .name dan method .getbuffer())."""

    def __init__(self, name: str, data: bytes):
        self.name = name
        self._data = data

    def getbuffer(self):
        return self._data


class DriveRequest(BaseModel):
    link: str


@router.post("/upload")
async def create_upload_job(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
):
    """Terima foto/ZIP, buat job, jalankan pipeline di background. Return job_id."""
    if not files:
        raise HTTPException(status_code=400, detail="Tidak ada file yang dikirim.")

    # Baca byte di event loop, lalu serahkan ke background task (sync, di threadpool).
    adapters = []
    for f in files:
        data = await f.read()
        adapters.append(_UploadAdapter(f.filename, data))
        await f.close()

    job = new_job()
    background_tasks.add_task(tasks.run_upload_job, job, adapters)
    return {"job_id": job.job_id}


@router.post("/drive")
async def create_drive_job(req: DriveRequest, background_tasks: BackgroundTasks):
    """Unduh dari folder Google Drive publik, lalu jalankan pipeline. Return job_id."""
    if not req.link.strip():
        raise HTTPException(status_code=400, detail="Link Google Drive kosong.")

    job = new_job()
    background_tasks.add_task(tasks.run_drive_job, job, req.link.strip())
    return {"job_id": job.job_id}


@router.get("/{job_id}")
async def job_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    return job.public_status()


@router.get("/{job_id}/progress")
async def job_progress(job_id: str):
    """Server-Sent Events: streaming progress sampai job selesai/gagal."""
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")

    async def event_stream():
        last = None
        while True:
            current = get_job(job_id)
            if current is None:
                yield f"data: {json.dumps({'status': 'gone'})}\n\n"
                return

            payload = current.public_status()
            snapshot = (payload["status"], payload["progress_pct"], payload["message"])
            if snapshot != last:
                yield f"data: {json.dumps(payload)}\n\n"
                last = snapshot

            if current.status != STATUS_RUNNING:
                return
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.delete("/{job_id}")
async def remove_job(job_id: str):
    if not delete_job(job_id):
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    return {"deleted": True}
