import { useCallback, useEffect, useState } from "react";
import { Volleyball, Table2, CalendarDays, CheckCircle2 } from "lucide-react";
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
import { computeStandings } from "../../utils/standings";
import { StandingsTable } from "../riyadhah/RiyadhahDashboard";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })
    : "—";

export default function GuestDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ctx = await leagueService.getContext();
      const [ms, ts] = await Promise.all([
        matchService.list(ctx.season_id),
        leagueService.listTeams(ctx.phase_id),
      ]);
      setData({
        ctx,
        matches: ms ?? [],
        standings: computeStandings(
          ts,
          (ms ?? []).filter((m) => m.status === "official"),
        ),
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={8} />;

  const curWeek = data.ctx.current_week ?? 1;
  const upcoming = data.matches.filter(
    (m) => m.week === curWeek && ["scheduled", "postponed"].includes(m.status),
  );
  const recent = data.matches
    .filter((m) => m.status === "official")
    .sort((a, b) => b.week - a.week || a.home_name.localeCompare(b.home_name))
    .slice(0, 6);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Match Center"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name} · Pekan ${curWeek}`}
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tim Aktif"
          value={data.ctx.teams_count}
          icon={Volleyball}
        />
        <StatCard
          label="Laga Resmi"
          value={data.ctx.matches_official}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Sisa Laga"
          value={data.ctx.matches_total - data.ctx.matches_official}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard label="Fase" value={data.ctx.phase_number} icon={Table2} />
      </div>

      <div className="gap-4 grid lg:grid-cols-2">
        <Card>
          <CardHeader title={`Pekan ${curWeek}`} description="Laga mendatang" />
          {upcoming.length === 0 ? (
            <EmptyState title="Tidak ada laga terjadwal" />
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

      <Card>
        <CardHeader
          title="Klasemen"
          description="Dihitung dari pertandingan resmi"
        />
        <div className="p-2">
          <StandingsTable rows={data.standings} compact />
        </div>
      </Card>
    </div>
  );
}
