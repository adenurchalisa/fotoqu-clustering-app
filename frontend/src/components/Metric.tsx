export default function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-sandborder bg-white p-4 text-center">
      <div className="text-2xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
