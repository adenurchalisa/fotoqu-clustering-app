import { useState } from "react";
import {
  clusterThumbUrl,
  fullPhotoUrl,
  getClusterPhotos,
  downloadUrl,
} from "../api/client";
import type { ClusterSummary, PhotoRef } from "../types";

interface Props {
  jobId: string;
  cluster: ClusterSummary;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}

export default function ClusterCard({ jobId, cluster, selected, onToggleSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoRef[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    // Lazy-load daftar foto hanya saat pertama dibuka (streaming render).
    if (next && photos === null) {
      setLoading(true);
      try {
        setPhotos(await getClusterPhotos(jobId, cluster.id));
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-2xl border border-sandborder bg-white overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(cluster.id)}
          className="h-5 w-5 accent-[#8A5A1E]"
          title="Pilih untuk download batch"
        />
        <img
          src={clusterThumbUrl(jobId, cluster.id)}
          loading="lazy"
          className="h-14 w-14 rounded-lg object-cover bg-sand"
          alt={`Cluster ${cluster.label}`}
        />
        <button onClick={toggleOpen} className="flex-1 text-left">
          <div className="font-semibold text-ink">Cluster {cluster.label}</div>
          <div className="text-xs text-muted">
            {cluster.n_faces} wajah dari {cluster.n_photos} foto · skor{" "}
            {cluster.rep_score.toFixed(2)}
          </div>
        </button>
        <a
          href={downloadUrl(jobId, [cluster.id])}
          className="rounded-full border border-sandborder px-4 py-1.5 text-sm font-medium text-ink hover:bg-sand transition"
        >
          ↓ ZIP
        </a>
        <button
          onClick={toggleOpen}
          className="text-muted text-sm w-6 text-center"
          aria-label="Buka/tutup"
        >
          {open ? "▲" : "▼"}
        </button>
      </div>

      {open && (
        <div className="border-t border-sandborder p-4">
          {loading && <p className="text-sm text-muted">Memuat foto…</p>}
          {photos && photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((p) => (
                <figure key={p.photo_id} className="text-center">
                  <img
                    src={fullPhotoUrl(jobId, p.photo_id)}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover bg-sand"
                    alt={p.filename}
                  />
                  <figcaption className="mt-1 truncate text-[0.65rem] text-muted">
                    {p.filename}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
