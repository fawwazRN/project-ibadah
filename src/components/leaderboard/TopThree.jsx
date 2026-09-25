import { Medal } from "lucide-react";
import { fmtNum } from "../../lib/calc";

const PODIUM = {
  0: {
    tag: "Peringkat 1",
    ring: "ring-1 ring-rose-400/40",
    tagCls: "bg-rose-400/10 text-rose-300 border-rose-400/30",
    num: "text-rose-300/15",
    lift: "sm:-translate-y-3 sm:shadow-card",
  },
  1: {
    tag: "Peringkat 2",
    ring: "ring-1 ring-amber-400/30",
    tagCls: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    num: "text-amber-300/15",
    lift: "",
  },
  2: {
    tag: "Peringkat 3",
    ring: "ring-1 ring-slate-400/20",
    tagCls: "bg-white/5 text-slate-300 border-white/15",
    num: "text-slate-400/15",
    lift: "",
  },
};

// Urutan podium: Ke-2 | Juara | Ke-3
const PODIUM_ORDER = [1, 0, 2];

export function TopThree({ entries, meId }) {
  if (entries.length === 0) return null;
  return (
    <div className="items-end gap-3 grid sm:grid-cols-3">
      {PODIUM_ORDER.filter((i) => entries[i]).map((i) => {
        const e = entries[i];
        const m = PODIUM[i];
        return (
          <div
            key={e.santri_id}
            className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] ${m.ring} ${m.lift} ${e.santri_id === meId ? "!border-brand/40" : ""}`}>
            <span
              className={`pointer-events-none absolute bottom-1 right-3 select-none font-display text-6xl font-bold leading-none ${m.num}`}>
              {i + 1}
            </span>
            <div className="relative p-5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${m.tagCls}`}>
                <Medal size={12} /> {m.tag}
              </span>
              <div className="flex items-center gap-3 mt-3.5">
                <AvatarSlot name={e.full_name} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 text-sm truncate">
                    {e.full_name}
                  </p>
                  <p className="text-slate-500 text-xs">Kelas {e.class_name}</p>
                </div>
              </div>
              <div className="relative mt-4 pt-3 border-white/[0.06] border-t">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-semibold text-rose-300 text-xl">
                    {fmtNum(e.score)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    poin · {fmtNum(e.violation_count)} pelanggaran
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AvatarSlot({ name }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const TINTS = [
    "text-emerald-300 bg-emerald-500/10",
    "text-teal-300 bg-teal-500/10",
    "text-sky-300 bg-sky-500/10",
    "text-violet-300 bg-violet-500/10",
    "text-amber-300 bg-amber-500/10",
  ];
  const tint =
    TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      className={`grid size-10 shrink-0 select-none place-items-center rounded-full border border-white/10 font-display text-xs font-semibold ${tint}`}>
      {initials || "?"}
    </span>
  );
}
