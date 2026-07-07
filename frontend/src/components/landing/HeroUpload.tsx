import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Link, Images, ArrowRight, CheckCircle2, X } from "lucide-react";
import { motion } from "motion/react";
import { uploadFiles, startDriveJob } from "../../api/client";

type UploadMode = "zip" | "foto" | "drive";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.heic,.heif,.webp";

export function HeroUpload() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<UploadMode>("zip");
  const [driveUrl, setDriveUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles(dropped);
  };

  async function handleSubmit() {
    if (busy) return;
    setError(null);
    try {
      setBusy(true);
      let jobId: string;
      if (mode === "drive") {
        if (!driveUrl.trim()) {
          setBusy(false);
          return;
        }
        jobId = (await startDriveJob(driveUrl.trim())).job_id;
      } else {
        if (files.length === 0) {
          setBusy(false);
          return;
        }
        jobId = (await uploadFiles(files)).job_id;
      }
      navigate(`/processing/${jobId}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const tabs: { id: UploadMode; label: string; icon: React.ReactNode }[] = [
    { id: "zip", label: "File ZIP", icon: <Upload size={14} /> },
    { id: "foto", label: "Foto", icon: <Images size={14} /> },
    { id: "drive", label: "Link Drive", icon: <Link size={14} /> },
  ];

  return (
    <section
      id="upload"
      className="relative min-h-screen flex flex-col"
      style={{ background: "#141210" }}
    >
      {/* Split canvas — kiri gelap, kanan terang */}
      <div className="absolute inset-0 hidden lg:block">
        <div
          className="absolute top-0 right-0 bottom-0 w-1/2"
          style={{ background: "#F7F5F0" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex-1 grid lg:grid-cols-2 gap-16 items-center pt-32 pb-24">
        {/* Kiri — copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8"
              style={{
                background: "rgba(201,132,58,0.15)",
                color: "#C9843A",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
              }}
            >
              Tanpa akun · 100% privat
            </span>

            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 1.08,
                color: "#F7F5F0",
                fontWeight: 400,
                marginBottom: "1.5rem",
              }}
            >
              Fotomu,<br />
              <em style={{ color: "#C9843A" }}>terurut per wajah.</em>
            </h1>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "1.0625rem",
                lineHeight: 1.7,
                color: "#A09A93",
                maxWidth: "36ch",
                marginBottom: "2.5rem",
              }}
            >
              Lepas folder campuran berisi ribuan foto. FotoQu mengelompokkan setiap gambar
              berdasarkan orang di dalamnya — otomatis, dalam hitungan detik, tanpa perlu daftar.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              {["Deteksi wajah", "Unduh ZIP", "Gratis selamanya"].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(201,132,58,0.2)" }}
                  >
                    <CheckCircle2 size={12} color="#C9843A" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.8125rem",
                      color: "#7A7570",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Kanan — kartu upload */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(20,18,16,0.08)",
              boxShadow: "0 4px 40px rgba(20,18,16,0.06)",
            }}
          >
            {/* Tab selector */}
            <div className="flex" style={{ borderBottom: "1px solid rgba(20,18,16,0.08)" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setMode(tab.id);
                    setError(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 transition-all duration-200"
                  style={{
                    background: mode === tab.id ? "#F7F5F0" : "transparent",
                    borderBottom: mode === tab.id ? "2px solid #C9843A" : "2px solid transparent",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8125rem",
                    fontWeight: mode === tab.id ? 500 : 400,
                    color: mode === tab.id ? "#141210" : "#7A7570",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {error && (
                <div
                  className="mb-5 rounded-xl px-4 py-3 flex items-start gap-2"
                  style={{
                    background: "rgba(201,58,58,0.08)",
                    border: "1px solid rgba(201,58,58,0.25)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.8125rem",
                      color: "#C93A3A",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </span>
                </div>
              )}

              {(mode === "zip" || mode === "foto") && (
                <div>
                  <div
                    className="rounded-xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-all duration-200"
                    style={{
                      border: `2px dashed ${dragging ? "#C9843A" : "rgba(20,18,16,0.15)"}`,
                      background: dragging ? "rgba(201,132,58,0.04)" : "#FAFAF8",
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: dragging ? "rgba(201,132,58,0.12)" : "#EDEAE3" }}
                    >
                      {mode === "zip" ? (
                        <Upload size={20} color={dragging ? "#C9843A" : "#7A7570"} />
                      ) : (
                        <Images size={20} color={dragging ? "#C9843A" : "#7A7570"} />
                      )}
                    </div>

                    {files.length > 0 ? (
                      <div className="text-center">
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#141210",
                          }}
                        >
                          {files.length === 1 ? files[0].name : `${files.length} file dipilih`}
                        </p>
                        <p
                          style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.75rem",
                            color: "#7A7570",
                            marginTop: "0.25rem",
                          }}
                        >
                          {(files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#141210",
                          }}
                        >
                          {mode === "zip" ? "Lepas file ZIP di sini" : "Lepas foto di sini"}
                        </p>
                        <p
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: "0.8125rem",
                            color: "#7A7570",
                            marginTop: "0.25rem",
                          }}
                        >
                          atau klik untuk memilih
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={mode === "foto"}
                    accept={mode === "zip" ? ".zip" : IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                  {files.length > 0 && (
                    <button
                      onClick={() => setFiles([])}
                      className="mt-3 inline-flex items-center gap-1.5"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        color: "#7A7570",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} /> Hapus pilihan
                    </button>
                  )}
                </div>
              )}

              {mode === "drive" && (
                <div>
                  <label
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#141210",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Link Google Drive publik
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/…"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.625rem",
                      border: "1.5px solid rgba(20,18,16,0.12)",
                      background: "#F7F5F0",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.8125rem",
                      color: "#141210",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#C9843A")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(20,18,16,0.12)")}
                  />
                  <p
                    className="mt-3"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      color: "#A09A93",
                      lineHeight: 1.5,
                    }}
                  >
                    Pastikan folder di-set "Siapa saja yang memiliki link dapat melihat"
                    sebelum dibagikan.
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={busy}
                className="w-full mt-6 flex items-center justify-center gap-2.5 py-3.5 rounded-xl transition-all duration-200"
                style={{
                  background: "#141210",
                  color: "#F7F5F0",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!busy) (e.currentTarget as HTMLElement).style.background = "#C9843A";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#141210";
                }}
              >
                {busy ? "Memproses…" : "Mulai memilah"}
                {!busy && <ArrowRight size={16} />}
              </button>

              <p
                className="text-center mt-4"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: "#A09A93",
                }}
              >
                File diproses dengan aman dan tidak pernah disimpan permanen.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Indikator scroll */}
      <div className="relative z-10 flex justify-center pb-10">
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              color: "#4A4540",
              letterSpacing: "0.1em",
            }}
          >
            SCROLL
          </span>
          <div
            className="w-px h-6"
            style={{ background: "linear-gradient(to bottom, #4A4540, transparent)" }}
          />
        </motion.div>
      </div>
    </section>
  );
}
