"""Endpoint hasil: daftar cluster, gambar (thumb/foto penuh), dan download ZIP."""
import io
import logging
import os

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response, StreamingResponse

from core.job_store import get_job, STATUS_DONE
from src.utils import numpy_to_pil, load_full_photo, create_cluster_zip

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["results"])


def _require_done(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job tidak ditemukan.")
    if job.status != STATUS_DONE:
        raise HTTPException(status_code=409, detail=f"Job belum selesai (status: {job.status}).")
    return job


def _jpeg_response(pil_img, quality=85) -> Response:
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=quality)
    return Response(content=buf.getvalue(), media_type="image/jpeg")


@router.get("/{job_id}/clusters")
async def list_clusters(job_id: str):
    """Daftar cluster (ter-sortir terbesar dulu) + metrics + jumlah noise. Tanpa biner."""
    job = _require_done(job_id)

    clusters_out = []
    for cid, faces in job.clusters.items():
        n_photos = len(set(f["source_photo"] for f in faces))
        rep_score = max(f["det_score"] for f in faces)
        clusters_out.append({
            "id": cid,
            "label": cid + 1,
            "n_faces": len(faces),
            "n_photos": n_photos,
            "rep_score": round(rep_score, 3),
        })

    return {
        "metrics": job.metrics,
        "noise_count": len(job.noise_faces or []),
        "clusters": clusters_out,
        "load_seconds": job.load_seconds,
        "face_extract_seconds": job.face_extract_seconds,
        "clustering_seconds": job.clustering_seconds,
    }


@router.get("/{job_id}/clusters/{cid}/thumb")
async def cluster_thumb(job_id: str, cid: int):
    """JPEG crop wajah representatif (skor deteksi tertinggi) cluster."""
    job = _require_done(job_id)
    faces = job.clusters.get(cid)
    if not faces:
        raise HTTPException(status_code=404, detail="Cluster tidak ditemukan.")
    rep_face = max(faces, key=lambda f: f["det_score"])
    return _jpeg_response(numpy_to_pil(rep_face["crop"]), quality=90)


@router.get("/{job_id}/clusters/{cid}/photos")
async def cluster_photos(job_id: str, cid: int):
    """Daftar foto unik dalam cluster: photo_id (index global) + filename."""
    job = _require_done(job_id)
    faces = job.clusters.get(cid)
    if not faces:
        raise HTTPException(status_code=404, detail="Cluster tidak ditemukan.")

    id_of = {path: i for i, path in enumerate(job.photo_index)}
    unique_paths = list(dict.fromkeys(f["source_photo"] for f in faces))
    photos = [
        {"photo_id": id_of[p], "filename": os.path.basename(p)}
        for p in unique_paths if p in id_of
    ]
    return {"cluster_id": cid, "photos": photos}


@router.get("/{job_id}/photos/{photo_id}")
async def full_photo(job_id: str, photo_id: int):
    """Foto penuh (downscaled untuk preview) berdasarkan index global photo_id."""
    job = _require_done(job_id)
    if photo_id < 0 or photo_id >= len(job.photo_index):
        raise HTTPException(status_code=404, detail="Foto tidak ditemukan.")
    pil_img = load_full_photo(job.photo_index[photo_id])
    if pil_img is None:
        raise HTTPException(status_code=404, detail="Foto gagal dibaca.")
    return _jpeg_response(pil_img)


@router.get("/{job_id}/noise/{idx}/thumb")
async def noise_thumb(job_id: str, idx: int):
    """JPEG crop wajah noise (tidak terkelompok) berdasarkan index."""
    job = _require_done(job_id)
    noise = job.noise_faces or []
    if idx < 0 or idx >= len(noise):
        raise HTTPException(status_code=404, detail="Wajah noise tidak ditemukan.")
    return _jpeg_response(numpy_to_pil(noise[idx]["crop"]), quality=90)


@router.get("/{job_id}/download")
async def download_clusters(job_id: str, cids: str = Query(..., description="ID cluster, dipisah koma")):
    """Unduh satu/lebih cluster sebagai ZIP berstruktur folder."""
    job = _require_done(job_id)

    try:
        selected_ids = [int(x) for x in cids.split(",") if x.strip() != ""]
    except ValueError:
        raise HTTPException(status_code=400, detail="Parameter cids tidak valid.")

    valid_ids = [c for c in selected_ids if c in job.clusters]
    if not valid_ids:
        raise HTTPException(status_code=404, detail="Tidak ada cluster valid yang dipilih.")

    zip_buffer = create_cluster_zip(job.clusters, valid_ids)
    filename = (
        f"cluster_{valid_ids[0] + 1}.zip" if len(valid_ids) == 1 else "facecluster_results.zip"
    )
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
