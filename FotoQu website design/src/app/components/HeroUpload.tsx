import { useState, useRef } from "react";
import { Upload, Link, FolderOpen, ArrowRight, X, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

type UploadMode = "zip" | "folder" | "drive";

export function HeroUpload() {
  const [mode, setMode] = useState<UploadMode>("zip");
  const [driveUrl, setDriveUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = () => {
    if ((mode === "zip" || mode === "folder") && !file) return;
    if (mode === "drive" && !driveUrl.trim()) return;
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setFile(null);
    setDriveUrl("");
  };

  const tabs: { id: UploadMode; label: string; icon: React.ReactNode }[] = [
    { id: "zip", label: "ZIP file", icon: <Upload size={14} /> },
    { id: "folder", label: "Folder", icon: <FolderOpen size={14} /> },
    { id: "drive", label: "Drive link", icon: <Link size={14} /> },
  ];

  return (
    <section
      id="upload"
      className="relative min-h-screen flex flex-col"
      style={{ background: "#141210" }}
    >
      {/* Split canvas — left dark text, right warm */}
      <div className="absolute inset-0 hidden lg:block">
        <div
          className="absolute top-0 right-0 bottom-0 w-1/2"
          style={{ background: "#F7F5F0" }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex-1 grid lg:grid-cols-2 gap-16 items-center pt-32 pb-24">
        {/* Left — copy */}
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
              No account needed · 100% private
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
              Your photos,<br />
              <em style={{ color: "#C9843A" }}>sorted by face.</em>
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
              Drop a mixed folder of thousands of photos. FotoQu groups every image by the person in it — automatically, in seconds, with no sign-up required.
            </p>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(201,132,58,0.2)" }}
                >
                  <CheckCircle2 size={12} color="#C9843A" />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem", color: "#7A7570" }}>
                  Face detection
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(201,132,58,0.2)" }}
                >
                  <CheckCircle2 size={12} color="#C9843A" />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem", color: "#7A7570" }}>
                  ZIP download
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(201,132,58,0.2)" }}
                >
                  <CheckCircle2 size={12} color="#C9843A" />
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem", color: "#7A7570" }}>
                  Free forever
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right — upload card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {submitted ? (
            <div
              className="rounded-2xl p-10 flex flex-col items-center text-center gap-5"
              style={{ background: "#FFFFFF", border: "1px solid rgba(20,18,16,0.08)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(201,132,58,0.1)" }}
              >
                <CheckCircle2 size={32} color="#C9843A" />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "1.5rem",
                    color: "#141210",
                    marginBottom: "0.5rem",
                  }}
                >
                  Uploaded successfully
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.875rem",
                    color: "#7A7570",
                    lineHeight: 1.6,
                  }}
                >
                  We're processing your photos now. Your grouped folders will be ready to download shortly.
                </p>
              </div>
              <div
                className="w-full rounded-xl p-4"
                style={{ background: "#F7F5F0", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#7A7570" }}
              >
                <div className="flex justify-between mb-2">
                  <span>Status</span>
                  <span style={{ color: "#C9843A" }}>Processing…</span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "#EDEAE3" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "#C9843A" }}
                    initial={{ width: "0%" }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 transition-colors duration-200"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8125rem",
                  color: "#7A7570",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#141210")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#7A7570")}
              >
                <X size={13} /> Start over
              </button>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#FFFFFF", border: "1px solid rgba(20,18,16,0.08)", boxShadow: "0 4px 40px rgba(20,18,16,0.06)" }}
            >
              {/* Tab selector */}
              <div
                className="flex"
                style={{ borderBottom: "1px solid rgba(20,18,16,0.08)" }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id)}
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
                      borderBottom: mode === tab.id ? "2px solid #C9843A" : "2px solid transparent",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8">
                {(mode === "zip" || mode === "folder") && (
                  <div>
                    <div
                      className="rounded-xl flex flex-col items-center justify-center gap-3 py-12 cursor-pointer transition-all duration-200"
                      style={{
                        border: `2px dashed ${dragging ? "#C9843A" : "rgba(20,18,16,0.15)"}`,
                        background: dragging ? "rgba(201,132,58,0.04)" : "#FAFAF8",
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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
                          <FolderOpen size={20} color={dragging ? "#C9843A" : "#7A7570"} />
                        )}
                      </div>

                      {file ? (
                        <div className="text-center">
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", fontWeight: 500, color: "#141210" }}>
                            {file.name}
                          </p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#7A7570", marginTop: "0.25rem" }}>
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", fontWeight: 500, color: "#141210" }}>
                            {mode === "zip" ? "Drop your ZIP file here" : "Drop your folder here"}
                          </p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8125rem", color: "#7A7570", marginTop: "0.25rem" }}>
                            or click to browse
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mode === "zip" ? ".zip" : undefined}
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                    />
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
                      Public Google Drive link
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
                      Make sure the folder is set to "Anyone with the link can view" before sharing.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full mt-6 flex items-center justify-center gap-2.5 py-3.5 rounded-xl transition-all duration-200"
                  style={{
                    background: "#141210",
                    color: "#F7F5F0",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#C9843A";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "#141210";
                  }}
                >
                  Sort my photos
                  <ArrowRight size={16} />
                </button>

                <p
                  className="text-center mt-4"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.75rem",
                    color: "#A09A93",
                  }}
                >
                  Your files are processed securely and never stored permanently.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Scroll indicator */}
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
          <div className="w-px h-6" style={{ background: "linear-gradient(to bottom, #4A4540, transparent)" }} />
        </motion.div>
      </div>
    </section>
  );
}
