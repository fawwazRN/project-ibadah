import { Card } from "./Card";

const TONES = {
  default: "border-white/[0.07] bg-white/[0.03] text-slate-400",
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  sky: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
  pink: "border-pink-400/25 bg-pink-400/10 text-pink-300",
  orange: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  indigo: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  brand: "border-brand/25 bg-brand/10 text-brand-soft",
};

// Garis aksen solid di sisi kiri kartu
const BAR = {
  default: "bg-slate-500/40",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  pink: "bg-pink-400",
  orange: "bg-orange-400",
  cyan: "bg-cyan-400",
  indigo: "bg-indigo-400",
  brand: "bg-brand",
};

// Warna otomatis bila `tone` tidak diisi: tiap label selalu dapat warna
// yang sama (konsisten), jadi dashboard otomatis berwarna-warni.
// Sengaja TIDAK memakai rose/amber karena itu warna "peringatan".
const AUTO = ["brand", "sky", "violet", "pink", "orange", "cyan", "indigo"];
const autoTone = (label = "") =>
  AUTO[
    [...String(label)].reduce((s, c) => s + c.charCodeAt(0), 0) % AUTO.length
  ];

export function StatCard({ label, value, sub, icon: Icon, tone }) {
  const t = tone && tone !== "default" ? tone : autoTone(label);
  return (
    <Card className="relative p-4 pl-5 overflow-hidden">
      <span className={`absolute inset-y-0 left-0 w-1 ${BAR[t]}`} />
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[11px] text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-2 font-display font-semibold text-slate-50 text-2xl">
            {value}
          </p>
          {sub && <p className="mt-1 text-slate-500 text-xs truncate">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg border ${TONES[t]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
    </Card>
  );
}
