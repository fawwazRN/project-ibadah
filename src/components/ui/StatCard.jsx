import { Card } from "./Card";
import { CountUp } from "./Motion";

// Chip ikon — default mengikuti warna aksen peran; `tone` dipakai bila
// angkanya memang membawa makna (merah = bahaya, hijau = baik, dst).
const ICON = {
  default: "bg-tint text-brand-dim",
  brand: "bg-tint text-brand-dim",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  pink: "bg-pink-100 text-pink-700",
  orange: "bg-orange-100 text-orange-700",
  cyan: "bg-cyan-100 text-cyan-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function StatCard({ label, value, sub, icon: Icon, tone = "default" }) {
  return (
    <Card className="p-4 lift group">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[11px] text-fg-3 uppercase tracking-wider">
            {label}
          </p>
          <p
            className="mt-1.5 font-display text-[26px] text-fg leading-none"
            style={{ fontWeight: "var(--head-weight)" }}>
            <CountUp value={value} />
          </p>
          {sub && <p className="mt-1.5 text-fg-3 text-xs truncate">{sub}</p>}
        </div>
        {Icon && (
          <span
            className={`grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${ICON[tone] ?? ICON.default}`}>
            <Icon size={18} strokeWidth={2.3} />
          </span>
        )}
      </div>
    </Card>
  );
}
