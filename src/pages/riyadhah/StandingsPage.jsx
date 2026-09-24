import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { computeStandings } from "../../utils/standings";
import { StandingsTable } from "./RiyadhahDashboard";

export default function StandingsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ctx = await leagueService.getContext();
      const [teams, matches, settings] = await Promise.all([
        leagueService.listTeams(ctx.phase_id),
        matchService.list(ctx.season_id),
        leagueService.getSettings(),
      ]);
      setData({
        ctx,
        rows: computeStandings(
          teams,
          matches.filter((m) => m.status === "official"),
          settings.tiebreak_order,
        ),
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={8} />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Klasemen Liga"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name} — hanya dari pertandingan resmi.`}
      />
      <Card>
        <CardHeader
          title="Peringkat"
          description="Tie-break: Poin → Selisih Gol → Gol Masuk → Head-to-Head"
        />
        <StandingsTable rows={data.rows} />
      </Card>
    </div>
  );
}
