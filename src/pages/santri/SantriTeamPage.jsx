import { useCallback, useEffect, useState } from "react";
import {
  Volleyball,
  Crown,
  Users,
  Ban,
  Trophy,
  Target,
  ShieldAlert,
  ChevronDown,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { GoalChip } from "../../components/ui/StatChips";
import { MATCH_STATUS_LABELS, MATCH_STATUS_TONES } from "../../lib/constants";
import { supabase } from "../../lib/supabaseClient";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { computeStandings } from "../../utils/standings";
import { StandingsTable } from "../riyadhah/RiyadhahDashboard";

export default function SantriTeamPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openEvents, setOpenEvents] = useState({});

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const my = await supabase.rpc("get_santri_league");
      if (my.error) throw my.error;
      const ctx = await leagueService.getContext();
      const [teams, matches, players] = await Promise.all([
        leagueService.listTeams(ctx.phase_id),
        matchService.list(ctx.season_id),
        matchService.playerStats(ctx.season_id),
      ]);
      const official = matches.filter((m) => m.status === "official");
      setData({
        mine: my.data,
        ctx,
        standings: computeStandings(teams, official),
        scorers: (players ?? []).filter((p) => p.goals > 0).slice(0, 5),
        matches,
      });
    })().catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const toggleEvents = async (matchId) => {
    if (openEvents[matchId]) {
      setOpenEvents((o) => ({ ...o, [matchId]: null }));
      return;
    }
    const events = await matchService.events(matchId);
    setOpenEvents((o) => ({ ...o, [matchId]: events }));
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={6} />;
  const team = data.mine?.team;
  const activeSusp = (data.mine?.suspensions ?? []).find(
    (s) => s.status === "active",
  );
  const teamMatches = data.mine?.team_matches ?? [];

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Tim Saya & Liga"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name} — klasemen, statistik, dan pertandingan.`}
      />

      {activeSusp && (
        <Card className="bg-rose-500/[0.06] p-4 border-rose-400/30">
          <p className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
            <Ban size={15} /> Kamu ter-suspensi — tidak dapat bermain
          </p>
          <p className="mt-1 text-rose-200/80 text-xs">
            {activeSusp.reason} · s.d.{" "}
            {new Date(activeSusp.end_date).toLocaleDateString("id-ID")}
          </p>
        </Card>
      )}

      {!team ? (
        <Card>
          <EmptyState
            icon={Volleyball}
            title="Belum tergabung dalam tim"
            description="Hubungi Qism Riyadhah untuk dimasukkan ke tim pada musim berjalan."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={team.name}
            description={
              team.leader ? `Ketua: ${team.leader}` : "Ketua belum ditunjuk"
            }
            actions={
              team.leader && (
                <Badge tone="emerald">
                  <Crown size={11} /> {team.leader}
                </Badge>
              )
            }
          />
          <ul className="gap-2 grid sm:grid-cols-2 lg:grid-cols-3 p-4">
            {(data.mine?.teammates ?? []).map((t) => (
              <li
                key={t.name}
                className="flex items-center gap-2.5 bg-white/[0.02] px-3 py-2.5 border border-white/[0.06] rounded-xl">
                <Avatar name={t.name} size="sm" />
                <div>
                  <p className="text-slate-200 text-sm">{t.name}</p>
                  <p className="text-[11px] text-slate-500">{t.class}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Klasemen Liga"
          description="Hanya dari pertandingan resmi"
        />
        <StandingsTable rows={data.standings} compact />
      </Card>

      <Card>
        <CardHeader
          title="Top Skor"
          description="Pencetak gol terbanyak musim ini"
          actions={<Trophy size={14} className="text-brand-soft" />}
        />
        {data.scorers.length === 0 ? (
          <EmptyState icon={Target} title="Belum ada gol tercatat" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {data.scorers.map((p, i) => (
              <li
                key={p.student_id}
                className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-5 font-mono text-slate-500 text-xs">
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
        )}
      </Card>

      <Card>
        <CardHeader
          title="Pertandingan Timku"
          description="Klik untuk melihat pencetak gol"
        />
        {teamMatches.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada jadwal" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {teamMatches.map((m) => (
              <li key={m.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="w-10 font-mono text-slate-500 text-xs">
                    P{m.week}
                  </span>
                  <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                    <span
                      className={
                        m.my_team_home ? "font-semibold text-brand-soft" : ""
                      }>
                      {m.home}
                    </span>{" "}
                    <span className="font-mono text-slate-400">
                      {m.home_score ?? "–"} - {m.away_score ?? "–"}
                    </span>{" "}
                    <span
                      className={
                        m.my_team_home ? "" : "font-semibold text-brand-soft"
                      }>
                      {m.away}
                    </span>
                  </p>
                  <Badge tone={MATCH_STATUS_TONES[m.status]}>
                    {MATCH_STATUS_LABELS[m.status]}
                  </Badge>
                  {m.status === "official" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={ChevronDown}
                      onClick={() => toggleEvents(m.id)}>
                      {openEvents[m.id] ? "Tutup" : "Gol & Kartu"}
                    </Button>
                  )}
                </div>
                {openEvents[m.id] && (
                  <div className="bg-white/[0.02] px-5 py-3 border-white/[0.04] border-t">
                    {openEvents[m.id].length === 0 ? (
                      <p className="text-slate-500 text-xs italic">
                        Belum ada event tercatat.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-slate-300 text-xs">
                        {openEvents[m.id].map((e) => (
                          <li key={e.id}>
                            <span className="font-mono text-slate-500">
                              {e.minute != null ? `${e.minute}'` : "—"}
                            </span>{" "}
                            {e.player_name}{" "}
                            <span className="text-slate-500">
                              ({e.team_name})
                            </span>{" "}
                            — {e.event_type}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
