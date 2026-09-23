import { Medal } from "lucide-react";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { fmtNum } from "../../lib/calc";

const META = {
  1: {
    ring: "ring-1 ring-rose-400/40",
    tag: "Peringkat 1",
    tagCls: "bg-rose-400/10 text-rose-300 border-rose-400/30",
    num: "text-rose-300/20",
    icon: "text-rose-300",
  },
  2: {
    ring: "ring-1 ring-amber-400/30",
    tag: "Peringkat 2",
    tagCls: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    num: "text-amber-300/20",
    icon: "text-amber-300",
  },
  3: {
    ring: "ring-1 ring-slate-400/20",
    tag: "Peringkat 3",
    tagCls: "bg-white/5 text-slate-300 border-white/15",
    num: "text-slate-400/20",
    icon: "text-slate-300",
  },
};

export function TopThree({ entries, meId }) {
  const order = [1, 0, 2]; // peringkat 1 di tengah pada layar lebar
  return (
    <div className="gap-3 grid sm:grid-cols-3">
      {order
        .filter((i) => entries[i])
        .map((i) => {
          const e = entries[i];
          const m = META[i + 1];
          return (
            <Card
              key={e.santri_id}
              className={`relative overflow-hidden p-5 ${m.ring} ${i === 0 ? "sm:-translate-y-2" : ""} ${e.santri_id === meId ? "border-brand/40" : ""}`}>
              <span
                className={`pointer-events-none absolute -right-2 -top-6 select-none font-display text-[92px] font-bold leading-none ${m.num}`}>
                {i + 1}
              </span>
              <div className="relative">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${m.tagCls}`}>
                  <Medal size={12} className={m.icon} /> {m.tag}
                </span>
                <div className="flex items-center gap-3 mt-3.5">
                  <Avatar name={e.full_name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 text-sm truncate">
                      {e.full_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      Kelas {e.class_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 mt-4 pt-3 border-white/[0.06] border-t">
                  <span className="font-mono font-semibold text-rose-300 text-xl">
                    {fmtNum(e.score)}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    poin · {fmtNum(e.violation_count)} pelanggaran
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
