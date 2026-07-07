import { ArrowRight, Camera } from "lucide-react";

export function CtaFooter() {
  return (
    <>
      {/* Pita CTA */}
      <section className="py-24" style={{ background: "#C9843A" }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 400,
                color: "#FFFFFF",
                lineHeight: 1.2,
                marginBottom: "0.5rem",
              }}
            >
              Siap merapikan kekacauan fotomu?
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Gratis. Tanpa akun. Selesai dalam hitungan menit.
            </p>
          </div>

          <a
            href="#upload"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full transition-all duration-200 shrink-0"
            style={{
              background: "#141210",
              color: "#F7F5F0",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FFFFFF";
              (e.currentTarget as HTMLElement).style.color = "#141210";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#141210";
              (e.currentTarget as HTMLElement).style.color = "#F7F5F0";
            }}
          >
            Mulai sekarang
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10"
        style={{ background: "#0E0C0A", borderTop: "1px solid rgba(247,245,240,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "#C9843A" }}
            >
              <Camera size={13} color="#fff" />
            </div>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1rem",
                color: "#F7F5F0",
              }}
            >
              FotoQu
            </span>
          </div>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.8125rem",
              color: "#4A4540",
            }}
          >
            © 2026 FotoQu. Foto diproses dengan hati-hati.
          </p>

          <div className="flex gap-6">
            {["Privasi", "Ketentuan", "Kontak"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8125rem",
                  color: "#4A4540",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#C9843A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4A4540")}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
