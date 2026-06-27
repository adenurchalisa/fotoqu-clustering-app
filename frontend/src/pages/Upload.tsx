import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadFiles, startDriveJob } from "../api/client";

type Tab = "file" | "drive";

export default function Upload() {
  const [tab, setTab] = useState<Tab>("file");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submitFiles() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const { job_id } = await uploadFiles(files);
      navigate(`/processing/${job_id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function submitDrive() {
    if (!link.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { job_id } = await startDriveJob(link.trim());
      navigate(`/processing/${job_id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div>
        <h1 className="font-serif text-4xl text-ink">Your photos, sorted by face.</h1>
        <p className="mt-4 max-w-md text-muted leading-relaxed">
          Drop a mixed folder of thousands of photos. FotoQu mengelompokkan setiap gambar
          berdasarkan orang di dalamnya — otomatis.
        </p>
        <p className="mt-3 text-sm text-accent/80">
          Maksimal 3000 foto · Format: JPG, PNG, HEIC · Bisa upload ZIP atau dari Google Drive.
        </p>
      </div>

      <div className="rounded-3xl border border-sandborder bg-white p-6">
        <div className="mb-5 flex gap-2 rounded-full bg-sand p-1">
          <TabBtn active={tab === "file"} onClick={() => setTab("file")}>
            📁 Upload File
          </TabBtn>
          <TabBtn active={tab === "drive"} onClick={() => setTab("drive")}>
            🔗 Google Drive
          </TabBtn>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {tab === "file" ? (
          <div>
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-sandborder bg-cream px-4 py-10 text-center hover:bg-sand transition">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.heic,.heif,.zip"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <div className="text-3xl">⬆️</div>
              <div className="mt-2 text-ink font-medium">Drop foto atau file ZIP di sini</div>
              <div className="text-xs text-muted mt-1">atau klik untuk memilih</div>
            </label>

            {files.length > 0 && (
              <p className="mt-3 text-sm text-muted">{files.length} file dipilih</p>
            )}

            <button
              onClick={submitFiles}
              disabled={busy || files.length === 0}
              className="mt-5 w-full rounded-full bg-ink py-3 font-semibold text-cream disabled:opacity-40 hover:opacity-90 transition"
            >
              {busy ? "Mengunggah…" : "Sort my photos →"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted">
              Tempel link folder Google Drive yang berisi foto. Pastikan folder di-set{" "}
              <b>"Anyone with the link"</b>.
            </p>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="mt-3 w-full rounded-xl border border-sandborder bg-cream px-4 py-3 outline-none focus:border-accent"
            />
            <button
              onClick={submitDrive}
              disabled={busy || !link.trim()}
              className="mt-5 w-full rounded-full bg-ink py-3 font-semibold text-cream disabled:opacity-40 hover:opacity-90 transition"
            >
              {busy ? "Memproses…" : "Download & Sort →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
        active ? "bg-white text-ink shadow-sm" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}
