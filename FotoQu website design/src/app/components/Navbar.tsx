import { useState, useEffect } from "react";
import { Camera } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(247,245,240,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(20,18,16,0.08)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: "#C9843A" }}
          >
            <Camera size={15} color="#fff" strokeWidth={2} />
          </div>
          <span
            className="tracking-tight"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "1.2rem",
              color: "#141210",
            }}
          >
            FotoQu
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {["How it works", "Features", "FAQ"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, "-")}`}
              className="transition-colors duration-200"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 400,
                color: "#7A7570",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#141210")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7A7570")}
            >
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#upload"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200"
          style={{
            background: "#141210",
            color: "#F7F5F0",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8125rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#C9843A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#141210";
          }}
        >
          Try now — it's free
        </a>
      </div>
    </header>
  );
}
