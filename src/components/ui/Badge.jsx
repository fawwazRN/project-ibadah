const TONES = {
  neutral: "border-line bg-soft-2 text-fg-2",
  emerald: "border-emerald-400/35 bg-emerald-400/10 text-emerald-700",
  amber: "border-amber-400/45 bg-amber-300/20 text-amber-700",
  rose: "border-rose-400/35 bg-rose-400/10 text-rose-700",
  sky: "border-sky-400/35 bg-sky-400/10 text-sky-700",
  violet: "border-violet-400/35 bg-violet-400/10 text-violet-700",
  brand: "border-brand/30 bg-brand/10 text-brand-dim",
  pink: "border-pink-400/35 bg-pink-400/10 text-pink-700",
  orange: "border-orange-400/40 bg-orange-400/10 text-orange-700",
  cyan: "border-cyan-400/40 bg-cyan-400/10 text-cyan-700",
  indigo: "border-indigo-400/35 bg-indigo-400/10 text-indigo-700",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span className={`badge ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}
