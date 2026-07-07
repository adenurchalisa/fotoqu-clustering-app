import logging
import numpy as np
import umap
import hdbscan
from sklearn.metrics import silhouette_score
from sklearn.neighbors import LocalOutlierFactor

from src.config import (
    HDBSCAN_CLUSTER_SELECTION_METHOD,
    HDBSCAN_MCS_PASS1,
    HDBSCAN_MCS_PASS2,
    HDBSCAN_MS_PASS1,
    HDBSCAN_MS_PASS2,
    GLOSH_THRESHOLD,
    STRENGTH_MIN,
    LOF_N_NEIGHBORS,
    LOF_CONTAMINATION,
    UMAP_N_COMPONENTS,
    UMAP_N_NEIGHBORS,
    UMAP_MIN_DIST,
    UMAP_RANDOM_STATE,
)

logger = logging.getLogger(__name__)


def _adaptive_pass1_params(n_inlier):
    """Scale MCS/MS untuk dataset kecil agar tidak semua jadi noise."""
    if n_inlier >= 200:
        return HDBSCAN_MCS_PASS1, HDBSCAN_MS_PASS1
    mcs = max(2, n_inlier // 20)
    ms  = max(1, mcs // 3)
    return mcs, ms


def cluster_faces(embeddings):
    n = len(embeddings)

    if n < 2:
        return np.array([-1] * n), None, {
            "n_clusters": 0, "n_noise": n,
            "noise_pct": 100.0, "coverage_pct": 0.0, "silhouette": None,
        }

    # 1. LOF — filter false detection di embedding space (512-dim)
    #    Skip jika dataset terlalu kecil (LOF butuh minimal n_neighbors + 1 sampel)
    inlier_mask = np.ones(n, dtype=bool)
    if n > LOF_N_NEIGHBORS + 5:
        lof = LocalOutlierFactor(
            n_neighbors=LOF_N_NEIGHBORS,
            contamination=LOF_CONTAMINATION,
            metric="cosine",
        )
        inlier_mask = lof.fit_predict(embeddings) == 1
        logger.info(f"LOF: {inlier_mask.sum()} inlier, {(~inlier_mask).sum()} outlier dari {n} wajah")

    X_inlier = embeddings[inlier_mask]
    n_inlier  = int(inlier_mask.sum())

    if n_inlier < 2:
        labels_all = np.full(n, -1, dtype=int)
        return labels_all, None, {
            "n_clusters": 0, "n_noise": n,
            "noise_pct": 100.0, "coverage_pct": 0.0, "silhouette": None,
        }

    # 2. UMAP — reduksi 512-dim → 30-dim pada inliers
    n_neighbors  = min(UMAP_N_NEIGHBORS, n_inlier - 1)
    # n_components harus <= n_inlier - 2 agar spectral init tidak gagal
    n_components = min(UMAP_N_COMPONENTS, max(2, n_inlier - 2))
    reducer = umap.UMAP(
        n_components=n_components,
        n_neighbors=n_neighbors,
        metric="cosine",
        min_dist=UMAP_MIN_DIST,
        random_state=UMAP_RANDOM_STATE,
        verbose=False,
    )
    logger.info(f"UMAP: {X_inlier.shape[1]}D → {n_components}D ({n_inlier} wajah)")
    X_umap = reducer.fit_transform(X_inlier)

    # 3. Adaptive MCS untuk Pass 1 (scale untuk dataset kecil)
    mcs1, ms1 = _adaptive_pass1_params(n_inlier)
    logger.info(f"HDBSCAN Pass 1: mcs={mcs1}, ms={ms1}")

    # 4. HDBSCAN Pass 1 dengan prediction_data=True (dibutuhkan approximate_predict)
    clu1 = hdbscan.HDBSCAN(
        min_cluster_size=mcs1,
        min_samples=ms1,
        metric="euclidean",
        cluster_selection_method=HDBSCAN_CLUSTER_SELECTION_METHOD,
        prediction_data=True,
    )
    labels1      = clu1.fit_predict(X_umap)
    glosh_scores = clu1.outlier_scores_

    # 5. GLOSH — tandai outlier permanen (tidak akan di-assign ke cluster manapun)
    perm_outlier = glosh_scores > GLOSH_THRESHOLD

    # 6. HDBSCAN Pass 2 — re-cluster noise Pass 1 yang bukan outlier permanen
    noise_mask1  = (labels1 == -1) & ~perm_outlier
    labels_final = labels1.copy()

    if noise_mask1.sum() >= HDBSCAN_MCS_PASS2 * 2:
        max_label = int(labels1.max()) if labels1.max() >= 0 else -1
        logger.info(f"HDBSCAN Pass 2: {noise_mask1.sum()} noise → mcs={HDBSCAN_MCS_PASS2}, ms={HDBSCAN_MS_PASS2}")
        clu2    = hdbscan.HDBSCAN(
            min_cluster_size=HDBSCAN_MCS_PASS2,
            min_samples=HDBSCAN_MS_PASS2,
            metric="euclidean",
            cluster_selection_method=HDBSCAN_CLUSTER_SELECTION_METHOD,
        )
        labels2 = clu2.fit_predict(X_umap[noise_mask1])
        # Offset label agar tidak tumpang tindih dengan Pass 1
        new_labels = np.where(labels2 >= 0, labels2 + max_label + 1, -1)
        labels_final[noise_mask1] = new_labels

    # 7. approximate_predict — assign sisa noise ke cluster terdekat Pass 1
    still_noise = (labels_final == -1) & ~perm_outlier
    if still_noise.sum() > 0 and labels1.max() >= 0:
        pred_labels, strengths = hdbscan.approximate_predict(clu1, X_umap[still_noise])
        assign_mask = strengths >= STRENGTH_MIN
        labels_final[still_noise] = np.where(assign_mask, pred_labels, -1)
        logger.info(f"approximate_predict: {assign_mask.sum()} wajah di-assign, {(~assign_mask).sum()} tetap noise")

    # 8. Map kembali ke indeks original (LOF outlier tetap -1)
    labels_all = np.full(n, -1, dtype=int)
    labels_all[inlier_mask] = labels_final

    # 9. Metrics
    clustered_mask = labels_all >= 0
    n_clusters     = len(set(labels_all[clustered_mask])) if clustered_mask.any() else 0
    n_noise        = int((labels_all == -1).sum())

    metrics = {
        "n_clusters":   n_clusters,
        "n_noise":      n_noise,
        "noise_pct":    round(n_noise / n * 100, 1),
        "coverage_pct": round(clustered_mask.sum() / n * 100, 1),
        "silhouette":   None,
    }

    if n_clusters > 1 and clustered_mask.sum() > n_clusters:
        try:
            metrics["silhouette"] = round(
                silhouette_score(embeddings[clustered_mask], labels_all[clustered_mask]), 4
            )
        except Exception:
            pass

    return labels_all, clu1, metrics


def run_clustering_pipeline(all_faces, progress_callback=None):
    if not all_faces:
        return {}, [], {
            "n_clusters": 0, "n_noise": 0,
            "noise_pct": 0, "coverage_pct": 0, "silhouette": None,
        }

    if progress_callback:
        progress_callback(1, 3, "Mereduksi dimensi (LOF + UMAP)...")

    embeddings = np.array([face["embedding"] for face in all_faces])

    if progress_callback:
        progress_callback(2, 3, "Mengelompokkan wajah (HDBSCAN Two-Pass + GLOSH)...")

    labels, _, metrics = cluster_faces(embeddings)

    if progress_callback:
        progress_callback(3, 3, "Menyusun hasil...")

    clusters    = {}
    noise_faces = []
    for face, label in zip(all_faces, labels):
        label = int(label)
        face["cluster_id"] = label
        if label == -1:
            noise_faces.append(face)
        else:
            clusters.setdefault(label, []).append(face)

    clusters = dict(sorted(clusters.items(), key=lambda x: len(x[1]), reverse=True))
    return clusters, noise_faces, metrics

