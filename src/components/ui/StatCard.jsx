import { Card } from "./Card";

const TONES = {
  default: "border-white/[0.07] bg-white/[0.03] text-slate-400",
  emerald: "border-brand/20 bg-brand/[0.07] text-brand-soft",
  amber: "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
  rose: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
  sky: "border-sky-400/20 bg-sky-400/[0.06] text-sky-300",
  violet: "border-violet-400/20 bg-violet-400/[0.06] text-violet-300",
  pink: "border-pink-400/20 bg-pink-400/[0.06] text-pink-300",
  orange: "border-orange-400/20 bg-orange-400/[0.06] text-orange-300",
  cyan: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300",
};

// Garis aksen warna di atas kartu
const BAR = {
  default: "from-slate-500/40",
  emerald: "from-emerald-400",
  amber: "from-amber-400",
  rose: "from-rose-400",
  sky: "from-sky-400",
  violet: "from-violet-400",
  pink: "from-pink-400",
  orange: "from-orange-400",
  cyan: "from-cyan-400",
};

export function StatCard({ label, value, sub, icon: Icon, tone = "default" }) {
  return (
    <Card className="relative p-4 overflow-hidden">
      <span
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent ${BAR[tone] ?? BAR.default}`}
      />
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
            className={`grid size-9 shrink-0 place-items-center rounded-lg border ${TONES[tone]}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
    </Card>
  );
}
