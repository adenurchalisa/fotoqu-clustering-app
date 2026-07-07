import { Link } from "react-router-dom";
import { Camera, ArrowLeft } from "lucide-react";

export default function ProcessHeader() {
  return (
    <header style={{ background: "rgba(247,245,240,0.92)", borderBottom: "1px solid rgba(20,18,16,0.08)" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
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
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 transition-colors duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8125rem",
            color: "#7A7570",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#141210")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#7A7570")}
        >
          <ArrowLeft size={14} /> Beranda
        </Link>
      </div>
    </header>
  );
}
