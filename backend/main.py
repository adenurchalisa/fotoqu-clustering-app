"""FaceCluster API — FastAPI.

Jalankan dari direktori backend/:
    uvicorn main:app --reload
Dokumentasi otomatis di http://localhost:8000/docs
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Muat model InsightFace sekali saat startup (menggantikan @st.cache_resource).
    from src.face_extractor import load_model
    logger.info("Memuat model InsightFace...")
    try:
        load_model()
        logger.info("Model siap.")
    except Exception as e:  # noqa: BLE001
        logger.error("Gagal memuat model saat startup: %s", e, exc_info=True)
    yield


app = FastAPI(title="FaceCluster API", version="1.0.0", lifespan=lifespan)

# CORS — origin frontend (Vite default :5173). Override lewat env FRONTEND_ORIGINS (koma).
_origins = os.environ.get(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.jobs import router as jobs_router       # noqa: E402
from api.results import router as results_router  # noqa: E402

app.include_router(jobs_router)
app.include_router(results_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
