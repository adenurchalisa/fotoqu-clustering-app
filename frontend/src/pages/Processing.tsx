import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2, SearchX, AlertTriangle } from "lucide-react";
import { progressStreamUrl, getJobStatus } from "../api/client";
import type { JobStatusResponse } from "../types";
import ProgressBar from "../components/ProgressBar";
import ProcessHeader from "../components/ProcessHeader";

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
        .catch(() =>
          setState({
            job_id: jobId,
            status: "error",
            progress_pct: 100,
            message: "Koneksi ke server terputus.",
            error: "Koneksi terputus",
          })
        );
    };

    return () => es.close();
  }, [jobId, navigate]);

  const pct = state?.progress_pct ?? 0;
  const status = state?.status ?? "running";

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0" }}>
      <ProcessHeader />

      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              color: "#C9843A",
            }}
          >
            SEDANG DIPROSES
          </span>
          <h1
            className="mt-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 400,
              color: "#141210",
              lineHeight: 1.2,
            }}
          >
            Memilah fotomu…
          </h1>
          <p
            className="mt-3 mx-auto"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#7A7570",
              maxWidth: "40ch",
            }}
          >
            Mendeteksi wajah dan mengelompokkannya — bisa memakan beberapa menit untuk koleksi
            besar.
          </p>
        </div>

        {status === "running" && (
          <div
            className="rounded-2xl p-8"
            style={{ background: "#FFFFFF", border: "1px solid rgba(20,18,16,0.08)" }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ display: "inline-flex" }}
              >
                <Loader2 size={22} color="#C9843A" />
              </motion.div>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "1.5rem",
                  color: "#141210",
                }}
              >
                {pct}%
              </span>
            </div>
            <ProgressBar pct={pct} />
            <p
              className="mt-4 text-center"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                color: "#7A7570",
              }}
            >
              {state?.message ?? "Memulai…"}
            </p>
          </div>
        )}

        {status === "empty" && (
          <StateCard
            tone="warn"
            icon={<SearchX size={28} color="#C9843A" />}
            title="Tidak ada wajah terdeteksi"
            body="Semua foto terbaca, tapi tidak ada wajah yang ditemukan. Coba foto lain."
          />
        )}

        {status === "error" && (
          <StateCard
            tone="error"
            icon={<AlertTriangle size={28} color="#C93A3A" />}
            title="Proses gagal"
            body={state?.error ?? state?.message ?? "Terjadi kesalahan."}
          />
        )}

        {(status === "empty" || status === "error") && (
          <div className="mt-8 text-center">
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
              ← Coba lagi
            </Link>
          </div>
        )}
      </div>
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
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const accent = tone === "error" ? "#C93A3A" : "#C9843A";
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center text-center gap-4"
      style={{ background: "#FFFFFF", border: `1px solid ${accent}33` }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: `${accent}1a` }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "1.375rem",
            color: "#141210",
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "#7A7570",
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
