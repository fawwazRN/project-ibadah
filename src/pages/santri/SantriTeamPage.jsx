import { useCallback, useEffect, useState } from "react";
import { Volleyball, Crown, Users, Ban } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { MATCH_STATUS_LABELS, MATCH_STATUS_TONES } from "../../lib/constants";
import { supabase } from "../../lib/supabaseClient";

export default function SantriTeamPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    supabase
      .rpc("get_santri_league")
      .then(({ data, error: e }) => {
        if (e) throw e;
        setData(data);
      })
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={5} />;
  const team = data.team;
  const activeSusp = (data.suspensions ?? []).find(
    (s) => s.status === "active",
  );

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Tim Saya"
        description="Tim, ketua, rekan setim, dan jadwal pertandingan musim berjalan."
      />

      {!team ? (
        <Card>
          <EmptyState
            icon={Volleyball}
            title="Belum tergabung dalam tim"
            description="Hubungi Qism Riyadhah untuk dimasukkan ke tim pada musim berjalan."
          />
        </Card>
      ) : (
        <>
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
              {(data.teammates ?? []).map((t) => (
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
        </>
      )}

      <Card>
        <CardHeader
          title="Pertandingan Timku"
          description="Semua laga tim pada musim berjalan"
        />
        {(data.team_matches ?? []).length === 0 ? (
          <EmptyState icon={Users} title="Belum ada jadwal" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {data.team_matches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3">
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
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
