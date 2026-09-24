import { useCallback, useEffect, useState } from "react";
import { Volleyball, Table2, Gavel, Ban } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { suspensionService } from "../../services/suspensionService";
import { computeStandings } from "../../utils/standings";
import { StandingsTable } from "./RiyadhahDashboard";

export default function RiyadhahRecapPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ctx = await leagueService.getContext();
      const [matches, teams, susp] = await Promise.all([
        matchService.list(ctx.season_id),
        leagueService.listTeams(ctx.phase_id),
        suspensionService.list(),
      ]);
      const official = matches.filter((m) => m.status === "official");
      const goals = official.reduce(
        (s, m) => s + (m.home_score ?? 0) + (m.away_score ?? 0),
        0,
      );
      setData({
        ctx,
        official,
        rows: computeStandings(teams, official),
        decisive: official.filter((m) => m.home_score !== m.away_score).length,
        draws: official.filter((m) => m.home_score === m.away_score).length,
        suspActive: susp.filter((s) => s.status === "active").length,
        pending: matches.filter((m) => m.status === "submitted").length,
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Rekap Liga"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name}`}
      />
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Laga Resmi"
          value={data.official.length}
          icon={Volleyball}
          tone="emerald"
        />
        <StatCard
          label="Total Gol"
          value={data.goals}
          icon={Volleyball}
          tone="amber"
        />
        <StatCard
          label="Berakhir Menang/Kalah"
          value={data.decisive}
          icon={Table2}
        />
        <StatCard label="Imbang" value={data.draws} icon={Table2} />
        <StatCard
          label="Pending Verifikasi"
          value={data.pending}
          icon={Gavel}
          tone="sky"
        />
        <StatCard
          label="Suspensi Aktif"
          value={data.suspActive}
          icon={Ban}
          tone="rose"
        />
      </div>
      <Card>
        <CardHeader
          title="Klasemen saat ini"
          description="Hanya pertandingan resmi"
        />
        <StandingsTable rows={data.rows} />
      </Card>
    </div>
  );
}
