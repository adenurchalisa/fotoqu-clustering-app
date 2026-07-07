export default function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid rgba(20,18,16,0.08)" }}
    >
      <div
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "1.75rem",
          color: "#141210",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="mt-1"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          color: "#7A7570",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
