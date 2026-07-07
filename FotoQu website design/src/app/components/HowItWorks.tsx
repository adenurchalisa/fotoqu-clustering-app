import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Upload your photos",
    description:
      "Drop a ZIP archive, point to a local folder, or paste a public Google Drive link containing your mixed photo collection — no account needed.",
    detail: "Supports JPG, PNG, HEIC, and WebP",
  },
  {
    number: "02",
    title: "FotoQu detects faces",
    description:
      "Our engine scans every photo, identifies each unique face, and clusters matching faces together — even across different lighting, angles, and ages.",
    detail: "Works on groups, partial faces, and large events",
  },
  {
    number: "03",
    title: "Download sorted folders",
    description:
      "Get a ZIP archive with one folder per person. Each folder is named by detected identity and contains every photo featuring that individual.",
    detail: "Ready in minutes, even for thousands of photos",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-28"
      style={{ background: "#F7F5F0" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-16">
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              color: "#C9843A",
            }}
          >
            HOW IT WORKS
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              color: "#141210",
              lineHeight: 1.15,
            }}
          >
            Three steps.<br />Zero friction.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative"
            >
              {/* connector line */}
              {i < steps.length - 1 && (
                <div
                  className="absolute top-5 left-full w-full h-px hidden md:block"
                  style={{
                    background: "linear-gradient(to right, rgba(20,18,16,0.12), rgba(20,18,16,0.03))",
                    zIndex: 0,
                    transform: "translateX(-50%)",
                    width: "100%",
                  }}
                />
              )}

              <div
                className="relative rounded-2xl p-8 h-full transition-all duration-300"
                style={{ border: "1px solid rgba(20,18,16,0.07)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,132,58,0.2)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 32px rgba(20,18,16,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(20,18,16,0.07)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.1em",
                    color: "#C9843A",
                    display: "block",
                    marginBottom: "1.25rem",
                  }}
                >
                  {step.number}
                </span>

                <h3
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "1.375rem",
                    fontWeight: 400,
                    color: "#141210",
                    marginBottom: "0.75rem",
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    color: "#6A6460",
                    marginBottom: "1.25rem",
                  }}
                >
                  {step.description}
                </p>

                <span
                  className="inline-flex px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(20,18,16,0.05)",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6875rem",
                    color: "#7A7570",
                    letterSpacing: "0.04em",
                  }}
                >
                  {step.detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
