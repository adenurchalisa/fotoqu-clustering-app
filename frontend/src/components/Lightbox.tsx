import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { fullPhotoUrl } from "../api/client";
import type { PhotoRef } from "../types";

interface Props {
  jobId: string;
  photos: PhotoRef[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Penampil foto full-size (lightbox) — buka satu foto cluster utuh (object-contain,
 * tidak ter-crop seperti thumbnail grid), dengan navigasi maju/mundur antar foto
 * dalam cluster yang sama. Keyboard: Esc tutup, panah kiri/kanan navigasi.
 */
export default function Lightbox({ jobId, photos, index, onClose, onNavigate }: Props) {
  const photo = photos[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      else if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(index + 1);
    }
    window.addEventListener("keydown", onKey);
    // Kunci scroll body selama lightbox terbuka
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(20,18,16,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      {/* Tombol tutup */}
      <button
        onClick={onClose}
        aria-label="Tutup"
        style={{
          position: "absolute",
          top: "1.25rem",
          right: "1.25rem",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          color: "#F7F5F0",
          cursor: "pointer",
        }}
      >
        <X size={22} />
      </button>

      {/* Tombol sebelumnya */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="Foto sebelumnya"
          style={navBtnStyle("left")}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Foto full-size */}
      <img
        src={fullPhotoUrl(jobId, photo.photo_id)}
        onClick={(e) => e.stopPropagation()}
        alt={photo.filename}
        style={{
          maxWidth: "100%",
          maxHeight: "80vh",
          objectFit: "contain",
          borderRadius: "0.5rem",
          background: "#EDEAE3",
        }}
      />

      {/* Tombol berikutnya */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="Foto berikutnya"
          style={navBtnStyle("right")}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Caption: nama file + posisi + download satuan */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          color: "#F7F5F0",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.8125rem",
            letterSpacing: "0.04em",
          }}
        >
          {photo.filename}
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.75rem",
            color: "rgba(247,245,240,0.6)",
          }}
        >
          {index + 1} / {photos.length}
        </span>
        <a
          href={fullPhotoUrl(jobId, photo.photo_id)}
          download={photo.filename}
          onClick={(e) => e.stopPropagation()}
          aria-label="Unduh foto ini"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8125rem",
            color: "#F7F5F0",
            textDecoration: "none",
            border: "1px solid rgba(247,245,240,0.3)",
            borderRadius: "9999px",
            padding: "0.25rem 0.75rem",
          }}
        >
          <Download size={14} /> Unduh
        </a>
      </div>
    </div>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: "1.25rem",
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    color: "#F7F5F0",
    cursor: "pointer",
  };
}
