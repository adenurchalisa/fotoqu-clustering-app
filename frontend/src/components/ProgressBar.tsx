import { motion } from "motion/react";

export default function ProgressBar({ pct }: { pct: number }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ background: "#EDEAE3" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: "#C9843A" }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>
  );
}
