# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**FotoQu / FaceCluster** — a web app that detects faces in a photo collection and
automatically groups photos by person. Input comes from direct upload (images or a ZIP)
or a public Google Drive folder; output is per-person clusters the user can download as
folder-structured ZIPs.

The app is split into **two independent parts**:
- **`backend/`** — a FastAPI service exposing the ML pipeline as HTTP endpoints, running
  jobs asynchronously with progress streamed over Server-Sent Events (SSE).
- **`frontend/`** — a React + Vite + Tailwind SPA that calls the backend API.

The Python code, comments, and the React UI strings are in **Indonesian** — match that
language when editing user-facing text and comments.

## Commands

### Backend
```bash
python -m venv venv
venv\Scripts\Activate.ps1                 # Windows PowerShell
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload                 # http://localhost:8000  (OpenAPI docs at /docs)
```
Run uvicorn **from inside `backend/`** — modules import as `from src...`, `from core...`,
`from api...`, which resolve when `backend/` is the working directory. `backend/packages.txt`
lists apt deps (libgl1-mesa-glx, libglib2.0-0) for OpenCV on Linux.

### Frontend
```bash
cd frontend
npm install
npm run dev                               # http://localhost:5173
npm run build                             # tsc -b && vite build (use this to type-check)
```

There is **no Python test suite or linter** configured. For the frontend, `npm run build`
runs the TypeScript type-checker and is the closest thing to a CI gate.

## Commit conventions
- **Conventional Commits** (`docs:`, `feat:`, `fix:`, `refactor:`, `chore:`, …).
- Keep commits **atomic** and small. Commit messages in **English**.

## Secrets

`GOOGLE_API_KEY` (a Google Drive API v3 key) is required for the Drive-download feature
only; upload works without it. It is loaded via `python-dotenv` from `backend/.env`
(gitignored; template in `backend/.env.example`) into `src/config.py`, then read by
`src/drive_handler.py:_get_api_key`. `FRONTEND_ORIGINS` (comma-separated) overrides the
CORS allow-list (default `http://localhost:5173`).

## Architecture

### Backend layering
- **`backend/src/`** — pure ML/IO logic, **free of any web-framework coupling** (this is
  the old Streamlit `src/`, with all `streamlit` imports removed). Reusable as a library.
- **`backend/core/`** — runtime glue: `job_store.py` (in-memory `JOBS` dict of `JobState`,
  replacing Streamlit `session_state`) and `tasks.py` (background runner that calls the
  pipeline and updates job progress).
- **`backend/api/`** — FastAPI routers: `jobs.py` (create/status/SSE) and `results.py`
  (clusters JSON, images, ZIP download).
- **`backend/main.py`** — app factory: `lifespan` loads the InsightFace model once at
  startup; CORS middleware; includes routers.

### Async job model
The ML pipeline is long-running, so it never runs inside a request. `POST /api/jobs/upload`
or `/api/jobs/drive` creates a `JobState`, schedules the work via `BackgroundTasks`, and
returns a `job_id` immediately. The frontend subscribes to `GET /api/jobs/{id}/progress`
(SSE) for live progress, then fetches results when `status == "done"`.

> Async/BackgroundTasks keep the server responsive and allow concurrent jobs — they do
> **not** speed up a single clustering batch. UMAP/HDBSCAN are global operations over all
> embeddings and cannot be partitioned without degrading quality; real single-batch
> speedup needs GPU (CUDA InsightFace, optionally cuML). Face **detection** is already
> parallelized via `ThreadPoolExecutor`.

### Two-stage ML pipeline (unchanged logic)
`src/pipeline.py:run_full_pipeline(photo_paths, progress_callback)` returns a dict
`{clusters, noise_faces, metrics, face_stats}` (it no longer writes to any session state).
Progress is reported purely through `progress_callback(pct, msg)` (face stage 0–50%,
clustering 50–100%).

1. **Face detection + embedding** — `src/face_extractor.py:process_all_photos`. InsightFace
   `buffalo_l` loaded once via a module-level singleton `load_model()` (prefers CUDA, falls
   back to CPU). Reads images with PIL, downscales to `MAX_IMAGE_INPUT_SIZE`, crops faces.
   Returns a flat list of face dicts plus stats. Runs photos across `ThreadPoolExecutor`.
2. **Clustering** — `src/clustering.py:run_clustering_pipeline`. UMAP (cosine, fixed NB09
   params) then HDBSCAN with adaptive `min_cluster_size`/`min_samples`. Label `-1` = noise.
   Returns `clusters` (dict `cluster_id → [faces]`, sorted largest-first), `noise_faces`,
   and `metrics`.

The face dict — `embedding` (clustering input), `crop` (image bytes for thumbnails/ZIP),
and `source_photo` (download grouping) — is the contract threaded through all stages; keep
those keys intact.

### Image delivery (replaces Streamlit base64 embedding)
The backend serves images as JPEG endpoints; the React `<img loading="lazy">` tags point at
them. `JobState.photo_index` maps a global `photo_id` → source path. Endpoints:
`clusters/{cid}/thumb` (rep-face crop), `photos/{photo_id}` (full photo via
`src/utils.py:load_full_photo`), `noise/{idx}/thumb`, and `download?cids=` (ZIP).

### Input sources (unchanged)
- **Upload** — `src/utils.py:save_uploaded_files(files, output_dir=...)`. Handles loose
  images and ZIPs (Zip-Slip guard), HEIC→JPG, parallelized. `output_dir` is per-job
  (`JobState.photo_dir`). The API wraps FastAPI `UploadFile` bytes in a small
  `_UploadAdapter` (`.name` + `.getbuffer()`) so this function is reused unchanged.
- **Google Drive** — `src/drive_handler.py:download_from_drive(link, output_dir=, ...)`.
  Lists folder recursively via Drive API v3, downloads in parallel, detects Google's
  large-file HTML confirmation page from leading bytes.

### Config & tuning
`src/config.py` is the single source of truth for hyperparameters and limits. UMAP values
and the largest-bucket HDBSCAN params are tuned NB09 constants — change deliberately.
Temp files live under `TEMP_DIR`; per-job photos under `TEMP_DIR/jobs/<job_id>`.

### Frontend structure
`frontend/src/`: `api/client.ts` (fetch wrapper + URL builders + `API_URL` from
`VITE_API_URL`), `pages/` (`Overview`, `Upload`, `Processing` (SSE via `EventSource`),
`Results`), `components/` (`TopNav`, `ProgressBar`, `Metric`, `ClusterCard`). Routing is
`react-router-dom` (`/`, `/upload`, `/processing/:jobId`, `/results/:jobId`). The FotoQu
theme (cream/sand/ink/accent + DM Serif Display) lives in `tailwind.config.js`. Results
gates download buttons (only reachable when the job is done) and renders clusters
progressively, lazy-loading each cluster's photos on expand.

## Conventions
- Keep ML/IO work inside `backend/src/` and **framework-free**; keep web concerns in
  `backend/api/` + `backend/core/`; keep rendering in `frontend/`.
- New tunable values go in `src/config.py`, not inline literals.
- User-facing strings and code comments are Indonesian.
