import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getClusters, downloadUrl, noiseThumbUrl } from "../api/client";
import type { ClustersResponse } from "../types";
import Metric from "../components/Metric";
import ClusterCard from "../components/ClusterCard";

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
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
        <p className="font-semibold">Gagal memuat hasil</p>
        <p className="mt-1 text-sm">{error}</p>
        <Link to="/upload" className="mt-4 inline-block underline">
          ← Upload foto baru
        </Link>
      </div>
    );
  }

  if (!data) return <p className="text-center text-muted">Memuat hasil…</p>;

  const m = data.metrics;
  const selectedIds = Array.from(selected);

  return (
    <div>
      <h2 className="text-2xl font-bold text-ink">📊 Hasil Pengelompokan</h2>
      <p className="mt-1 text-sm text-muted">
        Wajah berhasil dideteksi dan dikelompokkan secara otomatis.
      </p>

      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="👥 Cluster" value={m.n_clusters} />
        <Metric label="✅ Coverage" value={`${m.coverage_pct}%`} />
        <Metric label="🔇 Noise" value={`${m.noise_pct}%`} />
        <Metric label="📐 Silhouette" value={m.silhouette ?? "N/A"} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sandborder bg-sand px-5 py-4">
        <div className="text-sm text-ink">
          <b>{selectedIds.length}</b> cluster dipilih untuk download batch
        </div>
        <DownloadBatchButton jobId={jobId!} ids={selectedIds} />
      </div>

      <h3 className="mt-8 mb-3 text-lg font-semibold text-ink">👤 Gallery per Cluster</h3>
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
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold text-ink">
            🔇 Tidak Terkelompok — {data.noise_count} wajah
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {Array.from({ length: Math.min(data.noise_count, 24) }).map((_, i) => (
              <img
                key={i}
                src={noiseThumbUrl(jobId!, i)}
                loading="lazy"
                className="aspect-square w-full rounded-md object-cover bg-sand"
                alt={`Noise ${i}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/upload"
          className="inline-block rounded-full bg-ink px-6 py-2.5 font-semibold text-cream hover:opacity-90 transition"
        >
          🔄 Proses Foto Baru
        </Link>
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
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        disabled
          ? "cursor-not-allowed bg-ink/30 text-cream"
          : "bg-ink text-cream hover:opacity-90"
      }`}
      onClick={(e) => disabled && e.preventDefault()}
    >
      ↓ Download ZIP terpilih
    </a>
  );
}
