import { Link, useLocation } from "react-router-dom";

export default function TopNav() {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-sandborder bg-cream/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="font-serif text-2xl text-ink">FotoQu</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <NavItem to="/" label="Beranda" active={pathname === "/"} />
          <NavItem to="/upload" label="Upload" active={pathname.startsWith("/upload")} />
        </nav>
      </div>
    </header>
  );
}

function NavItem({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-full transition ${
        active ? "bg-ink text-cream" : "text-muted hover:bg-sand"
      }`}
    >
      {label}
    </Link>
  );
}
