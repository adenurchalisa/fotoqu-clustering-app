import { motion } from "motion/react";
import { ShieldCheck, Zap, Users, Globe, FolderDown, Fingerprint } from "lucide-react";

const features = [
  {
    icon: <Fingerprint size={20} />,
    title: "Pengelompokan wajah akurat",
    description:
      "Pengenalan mutakhir menangani usia, pencahayaan, ekspresi, dan wajah sebagian yang berbeda.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Privasi sejak awal",
    description:
      "Foto diproses sementara. Tidak ada yang disimpan di luar jendela pemrosesan.",
  },
  {
    icon: <Zap size={20} />,
    title: "Proses cepat",
    description:
      "Ribuan foto diproses dalam hitungan menit — bukan jam. Tanpa antrean, tanpa menunggu.",
  },
  {
    icon: <Users size={20} />,
    title: "Foto grup tertangani",
    description:
      "Satu foto bisa muncul di beberapa folder orang. Tidak ada foto yang terlewat.",
  },
  {
    icon: <Globe size={20} />,
    title: "Berbagai sumber",
    description:
      "Unggah ZIP, banyak foto sekaligus, atau tempel link berbagi Google Drive publik.",
  },
  {
    icon: <FolderDown size={20} />,
    title: "Output ZIP rapi",
    description:
      "Unduh satu ZIP rapi dengan subfolder berlabel. Ganti nama folder sesukamu.",
  },
];

export function Features() {
  return (
    <section id="fitur" className="py-28" style={{ background: "#F7F5F0" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16">
          <div>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.14em",
                color: "#C9843A",
              }}
            >
              FITUR
            </span>
            <h2
              className="mt-3"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 400,
                color: "#141210",
                lineHeight: 1.2,
              }}
            >
              Dibuat untuk foto<br />dunia nyata.
            </h2>
            <p
              className="mt-4"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                color: "#7A7570",
                maxWidth: "28ch",
              }}
            >
              Bukan potret studio sempurna — foto ulang tahun yang blur, acara ramai, scan
              berusia puluhan tahun.
            </p>
          </div>

          <div
            className="grid sm:grid-cols-2 gap-px"
            style={{ background: "rgba(20,18,16,0.07)", borderRadius: "1rem", overflow: "hidden" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="p-7 transition-colors duration-200"
                style={{ background: "#F7F5F0" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#F7F5F0";
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(201,132,58,0.1)", color: "#C9843A" }}
                >
                  {f.icon}
                </div>
                <h4
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    color: "#141210",
                    marginBottom: "0.5rem",
                  }}
                >
                  {f.title}
                </h4>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.875rem",
                    lineHeight: 1.65,
                    color: "#7A7570",
                  }}
                >
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
