export default function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-sand overflow-hidden">
      <div
        className="h-full bg-accent transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}
