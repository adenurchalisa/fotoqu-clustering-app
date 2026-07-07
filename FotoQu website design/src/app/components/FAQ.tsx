import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    q: "Do I need to create an account?",
    a: "No. FotoQu is completely account-free. Upload your photos, get your sorted output, done. We don't collect any personal information.",
  },
  {
    q: "How many photos can I upload at once?",
    a: "The current limit is 5,000 photos per upload or 2 GB, whichever comes first. For larger collections, you can split them into multiple uploads.",
  },
  {
    q: "Are my photos stored on your servers?",
    a: "Photos are only held in memory during processing and deleted immediately after your download is ready. We never store, index, or share your images.",
  },
  {
    q: "What if two people look similar?",
    a: "Our model uses deep facial geometry rather than surface appearance, so it handles siblings, twins, and similar-looking people with high accuracy — though no system is perfect.",
  },
  {
    q: "What file formats are supported?",
    a: "JPG, JPEG, PNG, HEIC, HEIF, and WebP. RAW files are not currently supported but are on the roadmap.",
  },
  {
    q: "Can I rename the person folders?",
    a: "The output ZIP uses auto-generated folder names. You can rename them freely after downloading — that's standard file management.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-28"
      style={{ background: "#141210" }}
    >
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
            Questions you might have
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
