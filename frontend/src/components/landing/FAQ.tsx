import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    q: "Apakah saya perlu membuat akun?",
    a: "Tidak. FotoQu sepenuhnya tanpa akun. Unggah foto, dapatkan hasil yang sudah terurut, selesai. Kami tidak mengumpulkan informasi pribadi apa pun.",
  },
  {
    q: "Berapa banyak foto yang bisa diunggah sekaligus?",
    a: "Saat ini batasnya 3.000 foto per unggahan. Untuk koleksi lebih besar, kamu bisa membaginya ke beberapa unggahan.",
  },
  {
    q: "Apakah foto saya disimpan di server kalian?",
    a: "Foto hanya disimpan di memori selama pemrosesan dan dihapus segera setelah unduhanmu siap. Kami tidak pernah menyimpan, mengindeks, atau membagikan gambarmu.",
  },
  {
    q: "Bagaimana jika dua orang terlihat mirip?",
    a: "Model kami menggunakan geometri wajah mendalam, bukan tampilan permukaan, sehingga menangani saudara kandung, kembar, dan orang yang mirip dengan akurasi tinggi — meski tidak ada sistem yang sempurna.",
  },
  {
    q: "Format file apa saja yang didukung?",
    a: "JPG, JPEG, PNG, HEIC, HEIF, dan WebP. File RAW belum didukung untuk saat ini.",
  },
  {
    q: "Bisakah saya mengganti nama folder orang?",
    a: "ZIP keluaran memakai nama folder yang dibuat otomatis. Kamu bebas menggantinya setelah mengunduh — itu pengelolaan file biasa.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28" style={{ background: "#141210" }}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6875rem",
              letterSpacing: "0.14em",
              color: "#C9843A",
            }}
          >
            FAQ
          </span>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight: 400,
              color: "#F7F5F0",
              lineHeight: 1.2,
            }}
          >
            Pertanyaan yang mungkin kamu punya
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden transition-colors duration-200"
              style={{
                background: open === i ? "rgba(247,245,240,0.06)" : "rgba(247,245,240,0.03)",
                border: `1px solid ${open === i ? "rgba(201,132,58,0.2)" : "rgba(247,245,240,0.07)"}`,
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    color: "#F7F5F0",
                  }}
                >
                  {faq.q}
                </span>
                <span
                  className="shrink-0 transition-colors duration-200"
                  style={{ color: open === i ? "#C9843A" : "#7A7570" }}
                >
                  {open === i ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <p
                      className="px-6 pb-5"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.9rem",
                        lineHeight: 1.7,
                        color: "#7A7570",
                      }}
                    >
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
