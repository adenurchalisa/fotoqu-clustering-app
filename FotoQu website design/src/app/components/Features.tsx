import { motion } from "motion/react";
import { ShieldCheck, Zap, Users, Globe, FolderDown, Fingerprint } from "lucide-react";

const features = [
  {
    icon: <Fingerprint size={20} />,
    title: "Accurate face clustering",
    description:
      "State-of-the-art recognition handles different ages, lighting, expressions, and partial faces.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Privacy by design",
    description:
      "Photos are processed ephemerally. Nothing is stored beyond the processing window.",
  },
  {
    icon: <Zap size={20} />,
    title: "Fast processing",
    description:
      "Thousands of photos processed in minutes — not hours. No queue, no wait.",
  },
  {
    icon: <Users size={20} />,
    title: "Group photos handled",
    description:
      "One photo can appear in multiple person folders. No photo is dropped.",
  },
  {
    icon: <Globe size={20} />,
    title: "Any source format",
    description:
      "ZIP uploads, local folder drag-and-drop, or a public Google Drive share link.",
  },
  {
    icon: <FolderDown size={20} />,
    title: "Clean ZIP output",
    description:
      "Download one tidy ZIP with labelled subfolders. Rename folders however you like.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="py-28"
      style={{ background: "#F7F5F0" }}
    >
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
              FEATURES
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
              Built to handle<br />real-world photos.
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
              Not perfect studio portraits — blurry birthday shots, crowded events, decade-old scans.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px" style={{ background: "rgba(20,18,16,0.07)", borderRadius: "1rem", overflow: "hidden" }}>
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="p-7 group transition-colors duration-200"
                style={{ background: "#F7F5F0" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#F7F5F0";
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200"
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
