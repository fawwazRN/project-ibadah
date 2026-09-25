import { useCallback, useEffect, useState } from "react";
import { Trophy, Target, ShieldAlert, Medal, Table2 } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { GoalChip, CardChips } from "../../components/ui/StatChips";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { computeStandings } from "../../utils/standings";
import { fmtNum } from "../../lib/calc";

const PODIUM = {
  0: {
    tag: "Juara",
    ring: "ring-1 ring-emerald-400/40",
    tagCls: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
    num: "text-emerald-300/15",
    lift: "sm:-translate-y-3",
  },
  1: {
    tag: "Ke-2",
    ring: "ring-1 ring-amber-400/30",
    tagCls: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    num: "text-amber-300/15",
    lift: "",
  },
  2: {
    tag: "Ke-3",
    ring: "ring-1 ring-slate-400/20",
    tagCls: "bg-white/5 text-slate-300 border-white/15",
    num: "text-slate-400/15",
    lift: "",
  },
};
const PODIUM_ORDER = [1, 0, 2];

function Podium({ entries, renderSub, renderValue }) {
  if (entries.length === 0) return null;
  return (
    <div className="items-end gap-3 grid sm:grid-cols-3">
      {PODIUM_ORDER.filter((i) => entries[i]).map((i) => {
        const e = entries[i];
        const m = PODIUM[i];
        return (
          <div
            key={e.student_id ?? e.team_id}
            className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] ${m.ring} ${m.lift}`}>
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
                <Avatar name={e.full_name ?? e.name} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 text-sm truncate">
                    {e.full_name ?? e.name}
                  </p>
                  <p className="text-slate-500 text-xs">{renderSub(e)}</p>
                </div>
              </div>
              <div className="relative mt-4 pt-3 border-white/[0.06] border-t">
                {renderValue(e)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GuestLeaderboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ctx = await leagueService.getContext();
      const [teams, matches, players, gks] = await Promise.all([
        leagueService.listTeams(ctx.phase_id),
        matchService.list(ctx.season_id),
        matchService.playerStats(ctx.season_id),
        matchService.goalkeeperStats(ctx.season_id),
      ]);
      setData({
        ctx,
        teams: computeStandings(
          teams,
          (matches ?? []).filter((m) => m.status === "official"),
        ),
        scorers: (players ?? [])
          .filter((p) => p.goals > 0)
          .sort((a, b) => b.goals - a.goals),
        gk: (gks ?? []).sort(
          (a, b) =>
            b.clean_sheets - a.clean_sheets ||
            a.goals_conceded - b.goals_conceded,
        ),
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={8} />;

  const topGK = data.gk[0] ?? null;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Leaderboard Liga"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name} — hanya dari pertandingan resmi.`}
      />

      {/* ---------- PODIUM TIM (Top 3) ---------- */}
      {data.teams.length >= 3 ? (
        <Podium
          entries={data.teams.slice(0, 3)}
          renderSub={(e) =>
            `${e.played} laga · SG ${e.gd > 0 ? `+${e.gd}` : e.gd}`
          }
          renderValue={(e) => (
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-bold text-brand-soft text-xl">
                {fmtNum(e.points)}
              </span>
              <span className="text-[11px] text-slate-500">poin</span>
            </div>
          )}
        />
      ) : (
        <Card>
          <EmptyState
            icon={Trophy}
            title="Data belum cukup"
            description="Podium tim tampil setelah ada minimal 3 tim dengan laga resmi."
          />
        </Card>
      )}

      {/* ---------- PODIUM PEMAIN / TOP SKOR (Top 3) ---------- */}
      <Card>
        <CardHeader
          title="Top Skor"
          description="Pencetak gol terbanyak — podium tampil bila ada 3 pencetak gol"
          actions={<Target size={15} className="text-brand-soft" />}
        />
        {data.scorers.length >= 3 ? (
          <div className="p-5 pb-0">
            <Podium
              entries={data.scorers.slice(0, 3)}
              renderSub={(e) => `${e.team_name} · ${e.appearances} laga`}
              renderValue={(e) => <GoalChip n={e.goals} />}
            />
          </div>
        ) : data.scorers.length > 0 ? (
          <ul className="divide-y divide-white/[0.04]">
            {data.scorers.map((p, i) => (
              <li
                key={p.student_id}
                className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-6 font-mono text-slate-500 text-xs">
                  {i + 1}
                </span>
                <Avatar name={p.full_name} size="sm" />
                <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                  {p.full_name}
                  <span className="ml-1.5 text-slate-500 text-xs">
                    {p.team_name}
                  </span>
                </p>
                <GoalChip n={p.goals} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Target}
            title="Belum ada gol tercatat"
            description="Gol dihitung dari event laga resmi."
          />
        )}
      </Card>

      {/* ---------- KIPER TERBAIK (Top 1, menonjol) ---------- */}
      <Card className={topGK ? "border-sky-400/30" : ""}>
        <CardHeader
          title="Kiper Terbaik"
          description="Peringkat 1 — berdasarkan clean sheet & paling sedikit kebobolan"
          actions={<ShieldAlert size={15} className="text-sky-300" />}
        />
        {!topGK ? (
          <EmptyState
            icon={ShieldAlert}
            title="Belum ada kiper terdaftar"
            description="Kiper diatur saat menambah anggota tim (posisi Kiper)."
          />
        ) : (
          <div className="relative p-6 overflow-hidden">
            <span className="-top-8 -right-3 absolute font-display font-bold text-[120px] text-sky-300/10 leading-none pointer-events-none select-none">
              GK
            </span>
            <div className="relative flex flex-wrap items-center gap-4">
              <span className="place-items-center grid bg-sky-400/10 border border-sky-400/25 rounded-2xl size-14 font-display font-bold text-sky-300 text-lg">
                #1
              </span>
              <Avatar name={topGK.full_name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-slate-50 text-lg">
                  {topGK.full_name}
                </p>
                <p className="text-slate-500 text-xs">
                  {topGK.team_name} · {topGK.class_name}
                </p>
              </div>
              <div className="flex gap-2 text-center">
                <div className="bg-white/[0.02] px-4 py-2 border border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Clean Sheet
                  </p>
                  <p className="font-display font-bold text-emerald-300 text-xl">
                    {topGK.clean_sheets}
                  </p>
                </div>
                <div className="bg-white/[0.02] px-4 py-2 border border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Kebobolan
                  </p>
                  <p className="font-display font-bold text-slate-200 text-xl">
                    {topGK.goals_conceded}
                  </p>
                </div>
                <div className="bg-white/[0.02] px-4 py-2 border border-white/[0.06] rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Laga
                  </p>
                  <p className="font-display font-bold text-slate-200 text-xl">
                    {topGK.matches}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* ---------- Klasemen lengkap ---------- */}
      <Card>
        <CardHeader
          title="Klasemen Tim Lengkap"
          description="Poin: Menang 3 · Imbang 1 · Kalah 0"
          actions={<Table2 size={15} className="text-slate-400" />}
        />
        <ul className="divide-y divide-white/[0.04]">
          {data.teams.map((r, i) => (
            <li key={r.team_id} className="flex items-center gap-3 px-5 py-2.5">
              <span
                className={`w-6 shrink-0 font-mono text-xs ${i < 3 ? "font-bold text-brand-soft" : "text-slate-500"}`}>
                {i + 1}
              </span>
              <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                {r.name}
              </p>
              <span className="hidden sm:block text-slate-500 text-xs">
                {r.played} laga
              </span>
              <span className="font-mono font-semibold text-brand-soft text-sm">
                {fmtNum(r.points)}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
