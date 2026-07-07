import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";
import { getClusters, downloadUrl, noiseThumbUrl } from "../api/client";
import type { ClustersResponse } from "../types";
import Metric from "../components/Metric";
import ClusterCard from "../components/ClusterCard";
import ProcessHeader from "../components/ProcessHeader";

export default function Results() {
  const { jobId } = useParams<{ jobId: string }>();
  const [data, setData] = useState<ClustersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!jobId) return;
    getClusters(jobId)
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, [jobId]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F5F0" }}>
        <ProcessHeader />
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <div
            className="rounded-2xl p-8"
            style={{ background: "#FFFFFF", border: "1px solid rgba(201,58,58,0.3)" }}
          >
            <p
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.375rem",
                color: "#141210",
              }}
            >
              Gagal memuat hasil
            </p>
            <p
              className="mt-2"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                color: "#7A7570",
              }}
            >
              {error}
            </p>
            <Link
              to="/"
              className="mt-5 inline-block"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                color: "#C9843A",
              }}
            >
              ← Unggah foto baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F5F0" }}>
        <ProcessHeader />
        <p
          className="text-center py-20"
          style={{ fontFamily: "'Inter', sans-serif", color: "#7A7570" }}
        >
          Memuat hasil…
        </p>
      </div>
    );
  }

  const m = data.metrics;
  const selectedIds = Array.from(selected);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0" }}>
      <ProcessHeader />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            letterSpacing: "0.14em",
            color: "#C9843A",
          }}
        >
          HASIL
        </span>
        <h1
          className="mt-3"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 400,
            color: "#141210",
            lineHeight: 1.2,
          }}
        >
          Foto sudah dikelompokkan
        </h1>
        <p
          className="mt-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9375rem",
            color: "#7A7570",
          }}
        >
          Wajah berhasil dideteksi dan dikelompokkan secara otomatis.
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="Cluster" value={m.n_clusters} />
          <Metric label="Coverage" value={`${m.coverage_pct}%`} />
          <Metric label="Noise" value={`${m.noise_pct}%`} />
          <Metric label="Silhouette" value={m.silhouette ?? "N/A"} />
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5"
          style={{ background: "#EDEAE3" }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.875rem",
              color: "#141210",
            }}
          >
            <b>{selectedIds.length}</b> cluster dipilih untuk download batch
          </div>
          <DownloadBatchButton jobId={jobId!} ids={selectedIds} />
        </div>

        <h2
          className="mt-12 mb-4"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: "#141210",
          }}
        >
          Galeri per orang
        </h2>
        <div className="space-y-3">
          {data.clusters.map((c) => (
            <ClusterCard
              key={c.id}
              jobId={jobId!}
              cluster={c}
              selected={selected.has(c.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>

        {data.noise_count > 0 && (
          <div className="mt-12">
            <h2
              className="mb-4"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "#141210",
              }}
            >
              Tidak terkelompok — {data.noise_count} wajah
            </h2>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {Array.from({ length: Math.min(data.noise_count, 24) }).map((_, i) => (
                <img
                  key={i}
                  src={noiseThumbUrl(jobId!, i)}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover"
                  style={{ background: "#EDEAE3" }}
                  alt={`Noise ${i}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 transition-all duration-200"
            style={{
              background: "#141210",
              color: "#F7F5F0",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#C9843A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#141210";
            }}
          >
            <RotateCcw size={15} /> Proses foto baru
          </Link>
        </div>
      </div>
    </div>
  );
}

function DownloadBatchButton({ jobId, ids }: { jobId: string; ids: number[] }) {
  const disabled = ids.length === 0;
  return (
    <a
      href={disabled ? undefined : downloadUrl(jobId, ids)}
      aria-disabled={disabled}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 transition-all duration-200"
      style={{
        background: disabled ? "rgba(20,18,16,0.25)" : "#141210",
        color: "#F7F5F0",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.875rem",
        fontWeight: 500,
        textDecoration: "none",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={(e) => disabled && e.preventDefault()}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = "#C9843A";
      }}
      onMouseLeave={(e) => {
        if (!disabled) (e.currentTarget as HTMLElement).style.background = "#141210";
      }}
    >
      <Download size={15} /> Download ZIP terpilih
    </a>
  );
}
