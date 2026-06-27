import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { progressStreamUrl, getJobStatus } from "../api/client";
import type { JobStatusResponse } from "../types";
import ProgressBar from "../components/ProgressBar";

export default function Processing() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<JobStatusResponse | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const es = new EventSource(progressStreamUrl(jobId));
    esRef.current = es;

    es.onmessage = (ev) => {
      const data: JobStatusResponse = JSON.parse(ev.data);
      setState(data);
      if (data.status !== "running") {
        es.close();
        if (data.status === "done") {
          navigate(`/results/${jobId}`, { replace: true });
        }
      }
    };

    es.onerror = () => {
      // SSE putus — fallback ke polling sekali untuk ambil status final.
      es.close();
      getJobStatus(jobId)
        .then((s) => {
          setState(s);
          if (s.status === "done") navigate(`/results/${jobId}`, { replace: true });
        })
        .catch(() => setState({ job_id: jobId, status: "error", progress_pct: 100, message: "Koneksi ke server terputus.", error: "Koneksi terputus" }));
    };

    return () => es.close();
  }, [jobId, navigate]);

  const pct = state?.progress_pct ?? 0;
  const status = state?.status ?? "running";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-sandborder bg-sand px-8 py-7">
        <h2 className="text-2xl font-bold text-ink">⏳ Memproses Foto</h2>
        <p className="mt-1 text-sm text-accent">
          Mendeteksi wajah dan mengelompokkan — bisa memakan beberapa menit.
        </p>
      </div>

      {status === "running" && (
        <div className="mt-6">
          <ProgressBar pct={pct} />
          <p className="mt-3 text-center text-sm text-muted">
            {state?.message ?? "Memulai…"} ({pct}%)
          </p>
        </div>
      )}

      {status === "empty" && (
        <StateCard
          tone="warn"
          icon="🔍"
          title="Tidak ada wajah terdeteksi"
          body="Semua foto terbaca, tapi tidak ada wajah yang ditemukan. Coba foto lain."
        />
      )}

      {status === "error" && (
        <StateCard
          tone="error"
          icon="❌"
          title="Proses gagal"
          body={state?.error ?? state?.message ?? "Terjadi kesalahan."}
        />
      )}

      {(status === "empty" || status === "error") && (
        <div className="mt-6 text-center">
          <Link
            to="/upload"
            className="inline-block rounded-full bg-ink px-6 py-2.5 font-semibold text-cream hover:opacity-90 transition"
          >
            ← Coba Lagi
          </Link>
        </div>
      )}
    </div>
  );
}

function StateCard({
  tone,
  icon,
  title,
  body,
}: {
  tone: "warn" | "error";
  icon: string;
  title: string;
  body: string;
}) {
  const colors =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return (
    <div className={`mt-6 rounded-2xl border px-6 py-6 text-center ${colors}`}>
      <div className="text-4xl">{icon}</div>
      <p className="mt-2 font-bold">{title}</p>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  );
}
