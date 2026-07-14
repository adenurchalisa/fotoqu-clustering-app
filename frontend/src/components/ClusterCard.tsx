import { useState } from "react";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import {
  clusterThumbUrl,
  fullPhotoUrl,
  getClusterPhotos,
  downloadUrl,
} from "../api/client";
import type { ClusterSummary, PhotoRef } from "../types";
import Lightbox from "./Lightbox";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
    <div
      className="rounded-2xl overflow-hidden transition-colors duration-200"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${selected ? "rgba(201,132,58,0.4)" : "rgba(20,18,16,0.08)"}`,
      }}
    >
      <div className="flex items-center gap-4 p-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(cluster.id)}
          className="h-5 w-5"
          style={{ accentColor: "#C9843A" }}
          title="Pilih untuk download batch"
        />
        <img
          src={clusterThumbUrl(jobId, cluster.id)}
          loading="lazy"
          className="h-14 w-14 rounded-xl object-cover"
          style={{ background: "#EDEAE3" }}
          alt={`Cluster ${cluster.label}`}
        />
        <button onClick={toggleOpen} className="flex-1 text-left" style={{ cursor: "pointer" }}>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: "#141210",
            }}
          >
            Orang {cluster.label}
          </div>
          <div
            className="mt-0.5"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              color: "#7A7570",
            }}
          >
            {cluster.n_faces} wajah · {cluster.n_photos} foto · skor {cluster.rep_score.toFixed(2)}
          </div>
        </button>
        <a
          href={downloadUrl(jobId, [cluster.id])}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all duration-200"
          style={{
            border: "1px solid rgba(20,18,16,0.12)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "#141210",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#F7F5F0";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Download size={14} /> ZIP
        </a>
        <button
          onClick={toggleOpen}
          className="w-7 h-7 flex items-center justify-center"
          style={{ color: "#7A7570", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Buka/tutup"
        >
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open && (
        <div className="p-4" style={{ borderTop: "1px solid rgba(20,18,16,0.08)" }}>
          {loading && (
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.8125rem",
                color: "#7A7570",
              }}
            >
              Memuat foto…
            </p>
          )}
          {photos && photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {photos.map((p, i) => (
                <figure key={p.photo_id} className="text-center">
                  <button
                    onClick={() => setLightboxIndex(i)}
                    className="block w-full"
                    style={{ padding: 0, border: "none", background: "none", cursor: "pointer" }}
                    title="Klik untuk lihat foto penuh"
                  >
                    <img
                      src={fullPhotoUrl(jobId, p.photo_id)}
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover transition-opacity duration-150 hover:opacity-80"
                      style={{ background: "#EDEAE3" }}
                      alt={p.filename}
                    />
                  </button>
                  <figcaption
                    className="mt-1 truncate"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.625rem",
                      color: "#7A7570",
                    }}
                  >
                    {p.filename}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}

      {photos && lightboxIndex !== null && (
        <Lightbox
          jobId={jobId}
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
