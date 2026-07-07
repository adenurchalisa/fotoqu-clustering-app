import { motion } from "motion/react";

const steps = [
  {
    number: "01",
    title: "Unggah foto kamu",
    description:
      "Lepas arsip ZIP, pilih banyak foto sekaligus, atau tempel link folder Google Drive publik berisi koleksi foto campuran — tanpa perlu akun.",
    detail: "Mendukung JPG, PNG, HEIC, dan WebP",
  },
  {
    number: "02",
    title: "FotoQu mendeteksi wajah",
    description:
      "Mesin kami memindai setiap foto, mengenali tiap wajah unik, lalu mengelompokkan wajah yang cocok — bahkan di pencahayaan, sudut, dan usia berbeda.",
    detail: "Andal untuk foto grup, wajah sebagian, dan acara besar",
  },
  {
    number: "03",
    title: "Unduh folder yang sudah rapi",
    description:
      "Dapatkan arsip ZIP berisi satu folder per orang. Setiap folder memuat semua foto yang menampilkan individu tersebut.",
    detail: "Siap dalam hitungan menit, meski ribuan foto",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="py-28" style={{ background: "#F7F5F0" }}>
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
            CARA KERJA
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
            Tiga langkah.<br />Tanpa ribet.
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
              {i < steps.length - 1 && (
                <div
                  className="absolute top-5 left-full w-full h-px hidden md:block"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(20,18,16,0.12), rgba(20,18,16,0.03))",
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
