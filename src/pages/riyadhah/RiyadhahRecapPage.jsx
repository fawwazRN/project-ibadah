import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Volleyball,
  Table2,
  Gavel,
  Ban,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { suspensionService } from "../../services/suspensionService";
import { computeStandings } from "../../utils/standings";
import { StandingsTable } from "./RiyadhahDashboard";
import PrintPoster from "../../components/riyadhah/PrintPoster";

export default function RiyadhahRecapPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = pekan ini · 1 = pekan lalu
  const [pendingPrint, setPendingPrint] = useState(false);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ctx = await leagueService.getContext();
      const [matches, teams, susp] = await Promise.all([
        matchService.list(ctx.season_id),
        leagueService.listTeams(ctx.phase_id),
        suspensionService.list(),
      ]);
      setData({
        ctx,
        matches,
        rows: computeStandings(
          teams,
          matches.filter((m) => m.status === "official"),
        ),
        suspActive: susp.filter((s) => s.status === "active"),
        pending: matches.filter((m) => m.status === "submitted").length,
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (!pendingPrint) return;
    const t = setTimeout(() => {
      window.print();
      setPendingPrint(false);
    }, 150);
    return () => clearTimeout(t);
  }, [pendingPrint]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={7} />;

  const curWeek = data.ctx.current_week ?? 1;
  const selectedWeek = Math.max(1, curWeek - weekOffset);
  const weekMatches = data.matches.filter((m) => m.week === selectedWeek);
  const official = weekMatches.filter((m) => m.status === "official");
  const goals = official.reduce(
    (s, m) => s + (m.home_score ?? 0) + (m.away_score ?? 0),
    0,
  );
  const draws = official.filter((m) => m.home_score === m.away_score).length;
  const decisive = official.length - draws;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Rekap Liga"
        description={`${data.ctx.phase_name} · ${data.ctx.season_name}`}
        actions={
          <Button
            variant="primary"
            icon={Printer}
            onClick={() => setPendingPrint(true)}>
            Cetak Poster Pekan {selectedWeek}
          </Button>
        }
      />

      {/* Pilihan pekan */}
      <div className="flex flex-wrap items-center gap-2">
        {[0, 1].map((off) => {
          const wk = curWeek - off;
          const label =
            off === 0 ? `Pekan ini (P${wk})` : `Pekan lalu (P${wk})`;
          const disabled = wk < 1;
          return (
            <button
              key={off}
              disabled={disabled}
              onClick={() => setWeekOffset(off)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                weekOffset === off
                  ? "border-brand/40 bg-brand/10 text-brand-soft"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
              } disabled:cursor-not-allowed disabled:opacity-40`}>
              {off === 0 ? (
                <ChevronRight size={12} />
              ) : (
                <ChevronLeft size={12} />
              )}{" "}
              {label}
            </button>
          );
        })}
      </div>

      {/* Statistik PEKAN TERPILIH */}
      <Card>
        <CardHeader
          title={`Rekap Pekan ${selectedWeek}`}
          description={
            selectedWeek === curWeek
              ? "Pekan yang sedang berjalan"
              : "Pekan yang sudah berlalu"
          }
        />
        <div className="gap-4 grid grid-cols-2 lg:grid-cols-5 p-4">
          <StatCard
            label="Laga Resmi"
            value={official.length}
            icon={Volleyball}
            tone="emerald"
          />
          <StatCard
            label="Total Gol"
            value={goals}
            icon={Volleyball}
            tone="amber"
          />
          <StatCard label="Menang/Kalah" value={decisive} icon={Table2} />
          <StatCard label="Imbang" value={draws} icon={Table2} />
          <StatCard
            label="Belum Resmi"
            value={weekMatches.length - official.length}
            icon={Gavel}
            tone="sky"
          />
        </div>
        {official.length === 0 ? (
          <p className="px-4 pb-4 text-slate-500 text-xs italic">
            Belum ada laga resmi pada pekan ini — hasil yang masih
            draft/verifikasi tidak dihitung.
          </p>
        ) : (
          <ul className="border-white/[0.06] border-t divide-y divide-white/[0.04]">
            {official.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 px-5 py-2.5 text-sm">
                <p className="flex-1 min-w-0 text-slate-200 truncate">
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

      {/* Ringkasan musim */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Pending Verifikasi (musim)"
          value={data.pending}
          icon={Gavel}
          tone="sky"
        />
        <StatCard
          label="Suspensi Aktif"
          value={data.suspActive.length}
          icon={Ban}
          tone="rose"
        />
        <StatCard label="Total Tim" value={data.rows.length} icon={Table2} />
      </div>

      <Card>
        <CardHeader
          title="Klasemen sementara (musim)"
          description="Hanya pertandingan resmi"
        />
        <StandingsTable rows={data.rows} />
      </Card>

      {/* Poster cetak — ikut pekan terpilih */}
      {createPortal(
        <div className="print-only">
          <PrintPoster
            ctx={data.ctx}
            week={selectedWeek}
            matches={data.matches}
            standings={data.rows}
            suspensions={data.suspActive}
          />
        </div>,
        document.body,
      )}
    </div>
  );
}
