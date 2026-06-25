# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**FaceCluster** — a Streamlit web app that detects faces in a photo collection and automatically groups photos by person. Input comes from direct upload (images or a ZIP) or a public Google Drive folder; output is per-person clusters the user can download as ZIPs. The codebase, comments, and UI strings are in **Indonesian** — match that language when editing user-facing text and comments.

## Commands

```bash
# 1. Create & activate a virtual environment (required — do this before installing)
python -m venv venv
source venv/Scripts/activate     # Windows (Git Bash);  Windows PowerShell: venv\Scripts\Activate.ps1
# source venv/bin/activate       # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt          # Python deps
# packages.txt lists apt deps (libgl1-mesa-glx, libglib2.0-0) for Streamlit Cloud / Linux

# 3. Run the app
streamlit run app.py                     # serves on http://localhost:8501
```

Always work inside the activated venv. There is **no test suite, linter, or build step** configured. `app.py` must stay the Streamlit entrypoint (it calls `st.set_page_config` first, before any other Streamlit call).

## Commit conventions
- Use **Conventional Commits** (`docs:`, `feat:`, `fix:`, `refactor:`, `chore:`, …).
- Keep commits **atomic** — one logical change each — and small enough to read at a glance.
- Write commit messages in **English** (existing history is Indonesian; English is the convention going forward).

## Secrets

`GOOGLE_API_KEY` (a Google Drive API v3 key) is required for the Drive-download feature only; upload works without it. It is read in `src/drive_handler.py:_get_api_key` with this precedence: `st.secrets["GOOGLE_API_KEY"]` → `GOOGLE_API_KEY` env var (via `src/config.py`). Local secrets live in `.streamlit/secrets.toml` (gitignored).

## Architecture

### Page routing (single-process SPA)
`app.py` is a manual router, not Streamlit multipage. It holds a `pages` dict mapping a string key to a `render()` function in `components/page_*.py`. The active page is `st.session_state.page`; navigation = set that key + `st.rerun()`. Flow: `overview → upload → processing → results`. `components/sidebar.py` renders nav buttons and live status. All shared state lives in `st.session_state` (`photos`, `clusters`, `noise_faces`, `metrics`, `face_stats`), initialized in `app.py`.

`components/__init__.py:reset_session_state()` clears that state **and** wipes the temp dir — call it before loading a new batch, which the upload/drive flows already do.

### Two-stage ML pipeline
`src/pipeline.py:run_full_pipeline` orchestrates everything and reports progress to a Streamlit progress bar (face stage = 0–50%, clustering = 50–100%):

1. **Face detection + embedding** — `src/face_extractor.py:process_all_photos`. Uses InsightFace `buffalo_l` (loaded once via `@st.cache_resource`, prefers CUDA, falls back to CPU). Reads images with **PIL** (robust to Windows Unicode paths + HEIC), downscales to `MAX_IMAGE_INPUT_SIZE` before detection for speed, crops each face with padding. Returns a flat list of face dicts (`embedding`, `crop`, `det_score`, `source_photo`, `bbox`) plus stats. Runs photos across a `ThreadPoolExecutor(max_workers=4)`.

2. **Clustering** — `src/clustering.py:run_clustering_pipeline`. UMAP (cosine, fixed NB09 hyperparameters in `config.py`) reduces embeddings, then HDBSCAN groups them. HDBSCAN `min_cluster_size`/`min_samples` are **adaptive** to face count via `get_adaptive_params`. Label `-1` = noise (ungrouped). Returns `clusters` (dict `cluster_id → [faces]`, sorted largest-first), `noise_faces`, and `metrics` (n_clusters, coverage %, noise %, silhouette). Guards small datasets (skips UMAP < 15 faces, caps `n_components`/`n_neighbors`).

The face dict — particularly `embedding` (clustering input), `crop` (preview/ZIP image), and `source_photo` (download grouping) — is the contract threaded through all three stages; keep those keys intact.

### Input sources
- **Upload** — `src/utils.py:save_uploaded_files`. Handles loose images and ZIPs (with Zip-Slip path guard), converts HEIC→JPG, parallelized with `ThreadPoolExecutor`. Capped at `MAX_PHOTOS_UPLOAD`.
- **Google Drive** — `src/drive_handler.py:download_from_drive`. Lists folder contents recursively via Drive API v3, then downloads each file over plain HTTP in parallel (`max_workers=20`). Detects Google's "large file" HTML confirmation page from the **leading bytes** (not Content-Type) and re-requests with the extracted confirm token.

### Config & tuning
`src/config.py` is the single source of truth for all hyperparameters and limits (face model/threshold, UMAP params, photo caps, temp dir, supported formats, UI preview caps). The UMAP values and the largest-bucket HDBSCAN params are tuned constants from the "NB09" experiment — change deliberately. Temp files live under `TEMP_DIR` (OS temp + `facecluster`); `cleanup_temp()` removes them.

### Caching conventions (important with Streamlit reruns)
- `@st.cache_resource` — the InsightFace model (load once per process).
- `@st.cache_data` — full-photo previews (`page_results._load_full_photo`) and cluster ZIPs (`utils._build_cluster_zip`). ZIP caching can't hash the big numpy crops, so `create_cluster_zip` builds a lightweight hashable **signature** (`_cluster_signature`) used as the cache key while the real cluster data is passed as a `_clusters` arg (leading underscore = "don't hash this").

## Conventions
- Keep ML/IO work inside `src/`; keep Streamlit rendering inside `components/`. Pages call into `src/` functions and pass a `progress_callback(current, total, msg)` for UI updates.
- New tunable values go in `src/config.py`, not inline literals.
- User-facing strings and code comments are Indonesian.
