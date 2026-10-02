const TONES = {
  neutral: "border-white/10 bg-white/[0.06] text-slate-300",
  emerald: "border-brand/25 bg-brand/10 text-emerald-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  pink: "border-pink-400/25 bg-pink-400/10 text-pink-300",
  orange: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  indigo: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
