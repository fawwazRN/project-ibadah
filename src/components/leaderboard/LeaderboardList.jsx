import { Avatar } from "../ui/Avatar";
import { fmtNum } from "../../lib/calc";

export function LeaderboardList({
  entries,
  startRank = 1,
  meId,
  showBar = true,
}) {
  const top = Math.max(entries[0]?.score ?? 1, 1);
  return (
    <div className="divide-y divide-white/[0.04]">
      {entries.map((e, i) => (
        <div
          key={e.santri_id}
          className={`flex items-center gap-3 px-4 py-3 sm:gap-4 ${e.santri_id === meId ? "bg-brand/[0.06]" : ""}`}>
          <span className="w-7 font-mono text-slate-500 text-sm shrink-0">
            {String(startRank + i).padStart(2, "0")}
          </span>
          <Avatar name={e.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 text-sm truncate">
              {e.full_name}
              {e.santri_id === meId && (
                <span className="bg-brand/10 ml-2 px-1.5 py-0.5 border border-brand/30 rounded text-[10px] text-brand-soft uppercase tracking-wider">
                  Kamu
                </span>
              )}
            </p>
            <p className="text-slate-500 text-xs">
              Kelas {e.class_name} · {fmtNum(e.violation_count)} pelanggaran
            </p>
          </div>
          {showBar && (
            <div className="hidden sm:block w-40">
              <div className="bg-white/[0.06] rounded-full h-1">
                <div
                  className="bg-rose-400/70 rounded-full h-1"
                  style={{ width: `${Math.max(5, (e.score / top) * 100)}%` }}
                />
              </div>
            </div>
          )}
          <span className="w-14 font-mono font-semibold text-rose-300 text-sm text-right">
            {fmtNum(e.score)}
          </span>
        </div>
      ))}
    </div>
  );
}
