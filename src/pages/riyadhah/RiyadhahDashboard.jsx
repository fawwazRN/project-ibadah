import { useCallback, useEffect, useState } from "react";
import {
  Volleyball,
  Table2,
  Gavel,
  Ban,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { MATCH_STATUS_LABELS, MATCH_STATUS_TONES } from "../../lib/constants";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { suspensionService } from "../../services/suspensionService";
import { computeStandings } from "../../utils/standings";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "—";

export function StandingsTable({ rows, compact = false }) {
  if (!rows.length)
    return <EmptyState icon={Table2} title="Belum ada data klasemen" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm text-left">
        <thead>
          <tr className="text-[11px] text-slate-500 uppercase tracking-wider">
            {["#", "Tim", "Main", "W", "D", "L", "GM", "GK", "SG", "Poin"].map(
              (h) => (
                <th
                  key={h}
                  className="px-3 py-2.5 border-white/[0.07] border-b font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.team_id}
              className={`transition-colors hover:bg-white/[0.02] ${r.status === "relegated" ? "opacity-50" : ""}`}>
              <td className="px-3 py-2 border-white/[0.04] border-b font-mono text-slate-500">
                {r.rank}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b font-medium text-slate-200">
                {r.name}
                {r.status === "relegated" && (
                  <Badge tone="rose" className="ml-2">
                    Degradasi
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-slate-300">
                {r.played}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-emerald-300">
                {r.wins}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-slate-400">
                {r.draws}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-rose-300">
                {r.losses}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-slate-400">
                {r.gf}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-slate-400">
                {r.ga}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b text-slate-300">
                {r.gd > 0 ? `+${r.gd}` : r.gd}
              </td>
              <td className="px-3 py-2 border-white/[0.04] border-b font-mono font-bold text-brand-soft">
                {r.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RiyadhahDashboard() {
  const [ctx, setCtx] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [susp, setSusp] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const c = await leagueService.getContext();
      setCtx(c);
      if (!c?.season_id) return;
      const [ms, ts, sp] = await Promise.all([
        matchService.list(c.season_id),
        leagueService.listTeams(c.phase_id),
        suspensionService.list("active"),
      ]);
      setMatches(ms ?? []);
      setTeams(ts ?? []);
      setSusp(sp ?? []);
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!ctx) return <LoadingState rows={8} />;

  const standings = computeStandings(
    teams,
    matches.filter((m) => m.status === "official"),
  );
  const curWeek = ctx.current_week ?? 1;
  const upcoming = matches.filter(
    (m) => m.week === curWeek && ["scheduled", "postponed"].includes(m.status),
  );
  const recent = matches
    .filter((m) => m.status === "official")
    .sort((a, b) => b.week - a.week || a.home_name.localeCompare(b.home_name))
    .slice(0, 6);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Match Center"
        description={`${ctx.phase_name} · ${ctx.season_name} · Pekan ${curWeek}`}
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tim Aktif" value={ctx.teams_count} icon={Volleyball} />
        <StatCard
          label="Laga Resmi"
          value={ctx.matches_official}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Sisa Laga"
          value={ctx.matches_total - ctx.matches_official}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Verifikasi Pending"
          value={ctx.pending_verification}
          icon={Gavel}
          tone="sky"
        />
        <StatCard
          label="Suspensi Aktif"
          value={susp.length}
          icon={Ban}
          tone="rose"
        />
      </div>

      <div className="gap-4 grid lg:grid-cols-2">
        <Card>
          <CardHeader
            title={`Pekan ${curWeek}`}
            description="Laga mendatang pekan ini"
          />
          {upcoming.length === 0 ? (
            <EmptyState
              title="Tidak ada laga terjadwal"
              description="Buat jadwal di menu Jadwal & Hasil."
            />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {upcoming.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                    {m.home_name} <span className="text-slate-600">vs</span>{" "}
                    {m.away_name}
                  </p>
                  <span className="text-slate-500 text-xs">
                    {fmtDate(m.scheduled_at)}
                  </span>
                  <Badge tone={MATCH_STATUS_TONES[m.status]}>
                    {MATCH_STATUS_LABELS[m.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Hasil terbaru" description="Pertandingan resmi" />
          {recent.length === 0 ? (
            <EmptyState title="Belum ada hasil resmi" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {recent.map((m) => (
                <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-8 font-mono text-slate-500 text-xs shrink-0">
                    P{m.week}
                  </span>
                  <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                    {m.home_name}{" "}
                    <span className="font-mono font-semibold text-brand-soft">
                      {m.home_score} - {m.away_score}
                    </span>{" "}
                    {m.away_name}
                  </p>
                  <Badge tone="emerald">Resmi</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="gap-4 grid lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Klasemen"
            description="Dihitung otomatis dari pertandingan resmi"
          />
          <div className="p-2">
            <StandingsTable rows={standings.slice(0, 8)} compact />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Pemain ter-suspensi"
            description="Tidak dapat bermain"
          />
          {susp.length === 0 ? (
            <EmptyState title="Tidak ada suspensi aktif" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {susp.slice(0, 8).map((s) => (
                <li key={s.id} className="px-5 py-2.5">
                  <p className="font-medium text-slate-200 text-sm">
                    {s.full_name}{" "}
                    <span className="text-slate-500 text-xs">
                      {s.class_name}
                    </span>
                  </p>
                  <p className="text-rose-300/80 text-xs truncate">
                    {s.reason} · s.d. {fmtDate(s.end_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
