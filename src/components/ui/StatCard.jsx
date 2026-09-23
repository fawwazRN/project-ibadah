import { Card } from "./Card";

const TONES = {
  default: "border-white/[0.07] bg-white/[0.03] text-slate-400",
  emerald: "border-brand/20 bg-brand/[0.07] text-brand-soft",
  amber: "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
  rose: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
  sky: "border-sky-400/20 bg-sky-400/[0.06] text-sky-300",
};

export function StatCard({ label, value, sub, icon: Icon, tone = "default" }) {
  return (
    <Card className="p-4">
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
