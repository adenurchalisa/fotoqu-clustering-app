import { motion } from "motion/react";
import { Folder, Image, Download } from "lucide-react";

const people = [
  { name: "Orang A", count: 47, color: "#C9843A" },
  { name: "Orang B", count: 23, color: "#7A9E9F" },
  { name: "Orang C", count: 31, color: "#9B7A6E" },
  { name: "Orang D", count: 12, color: "#6E7A9B" },
];

const unsplashPhotos = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format",
];

export function OutputPreview() {
  return (
    <section style={{ background: "#141210" }} className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Kiri — copy */}
          <div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.14em",
                color: "#C9843A",
              }}
            >
              HASILNYA
            </span>
            <h2
              className="mt-3 mb-6"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 400,
                color: "#F7F5F0",
                lineHeight: 1.2,
              }}
            >
              Satu folder per orang.<br />
              <em style={{ color: "#C9843A" }}>Tiap foto tercatat rapi.</em>
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9375rem",
                lineHeight: 1.75,
                color: "#7A7570",
                maxWidth: "38ch",
                marginBottom: "2rem",
              }}
            >
              Mau reuni keluarga, pernikahan, atau foto HP bertahun-tahun — FotoQu menata
              kekacauan menjadi struktur bersih yang mudah dijelajahi dalam hitungan menit.
            </p>

            <div
              className="rounded-xl p-5"
              style={{
                background: "rgba(247,245,240,0.04)",
                border: "1px solid rgba(247,245,240,0.08)",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.8125rem",
                color: "#7A7570",
                lineHeight: 2,
              }}
            >
              <div style={{ color: "#C9843A" }}>📁 foto_terurut.zip</div>
              <div className="ml-4">├── Orang A (47 foto)</div>
              <div className="ml-4">├── Orang B (23 foto)</div>
              <div className="ml-4">├── Orang C (31 foto)</div>
              <div className="ml-4">└── Orang D (12 foto)</div>
            </div>

            <a
              href="#upload"
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-200"
              style={{
                background: "rgba(201,132,58,0.12)",
                color: "#C9843A",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "1px solid rgba(201,132,58,0.25)",
                cursor: "pointer",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#C9843A";
                (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(201,132,58,0.12)";
                (e.currentTarget as HTMLElement).style.color = "#C9843A";
              }}
            >
              <Download size={15} />
              Coba sekarang
            </a>
          </div>

          {/* Kanan — grid folder visual */}
          <div className="grid grid-cols-2 gap-4">
            {people.map((person, i) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="rounded-xl p-4 cursor-pointer transition-all duration-200"
                style={{
                  background: "rgba(247,245,240,0.04)",
                  border: "1px solid rgba(247,245,240,0.07)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(247,245,240,0.07)";
                  (e.currentTarget as HTMLElement).style.borderColor = `rgba(${hexToRgb(person.color)},0.4)`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(247,245,240,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(247,245,240,0.07)";
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Folder size={16} color={person.color} />
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "#F7F5F0",
                    }}
                  >
                    {person.name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 mb-3">
                  {unsplashPhotos.slice(i, i + 3).map((url, j) => (
                    <div
                      key={j}
                      className="aspect-square rounded overflow-hidden"
                      style={{ background: "rgba(247,245,240,0.08)" }}
                    >
                      <img
                        src={url}
                        alt={`Foto ${person.name}`}
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <Image size={12} color="#7A7570" />
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.6875rem",
                      color: "#7A7570",
                    }}
                  >
                    {person.count} foto
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
