import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock,
  ChevronRight,
  Flag,
  Footprints,
  MessagesSquare,
  Newspaper,
  Trophy,
  Volleyball,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Mascot } from "../../components/ui/Mascot";
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
    ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    : "—";

const TILES = [
  { to: "/guest/bk", title: "Kak Peci", desc: "Teman ngobrol santri", icon: MessagesSquare, q: "q-brand" },
  { to: "/guest/artikel", title: "Artikel BK", desc: "Bacaan ringan", icon: Newspaper, q: "q-ibadah" },
  { to: "/guest/ibadah", title: "Qism Ibadah", desc: "Aktivitas ibadah", icon: Flag, q: "q-ibadah" },
  { to: "/guest/nadzhofah", title: "Nadzhofah", desc: "Info kebersihan", icon: Footprints, q: "q-nadzhofah" },
  { to: "/guest/zikir", title: "Jadwal Zikir", desc: "Jadwal tersedia", icon: CalendarClock, q: "q-lughah" },
  { to: "/guest/leaderboard", title: "Peringkat", desc: "Ringkasan peringkat", icon: Trophy, q: "q-riyadhah" },
];

export default function GuestDashboard() {
  const navigate = useNavigate();
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

  const curWeek = data?.ctx.current_week ?? 1;
  const upcoming = data
    ? data.matches.filter(
        (m) => m.week === curWeek && ["scheduled", "postponed"].includes(m.status),
      )
    : [];
  const recent = data
    ? data.matches
        .filter((m) => m.status === "official")
        .sort((a, b) => b.week - a.week || a.home_name.localeCompare(b.home_name))
        .slice(0, 6)
    : [];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <section className="q-brand q-card flex sm:flex-row flex-col items-center gap-4 p-5 sm:p-7 text-center sm:text-left">
        <Mascot mood="cheer" size={130} wave className="shrink-0 animate-float" />
        <div className="flex-1">
          <h1 className="font-display text-fg text-[26px] sm:text-3xl leading-tight" style={{ fontWeight: 900 }}>
            Pantau kegiatan OSIS, kapan saja.
          </h1>
          <p className="mt-2 font-semibold text-fg-2 text-sm">
            Liga, jadwal zikir, dan informasi publik dari empat qism — dalam satu aplikasi.
          </p>
          <div className="flex sm:flex-row flex-col gap-2.5 mt-4 sm:max-w-sm">
            <Button variant="primary" size="lg" onClick={() => navigate("/auth/login")}>
              Masuk sebagai santri
            </Button>
          </div>
        </div>
      </section>

      {/* Jelajahi */}
      <section>
        <h2 className="mb-3 font-display text-fg text-lg" style={{ fontWeight: 900 }}>
          Jelajahi
        </h2>
        <div className="gap-3 grid grid-cols-2 lg:grid-cols-4">
          {TILES.map((t) => (
            <Link key={t.to} to={t.to} className={`${t.q} q-card press-tile block p-4`}>
              <span className="q-chip rounded-2xl size-11">
                <t.icon size={22} strokeWidth={2.4} />
              </span>
              <p className="mt-3 font-display text-fg text-sm" style={{ fontWeight: 900 }}>
                {t.title}
              </p>
              <p className="mt-0.5 font-semibold text-fg-3 text-xs">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Match Center */}
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !data ? (
        <LoadingState rows={5} />
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-fg text-lg" style={{ fontWeight: 900 }}>
              Match Center
            </h2>
            <p className="font-semibold text-fg-3 text-sm">
              {data.ctx.phase_name} · {data.ctx.season_name} · Pekan {curWeek}
            </p>
          </div>

          <div>
            <p className="mb-2 font-extrabold text-[11px] text-fg-3 uppercase tracking-widest">
              Pekan {curWeek} · laga mendatang
            </p>
            {upcoming.length === 0 ? (
              <Card>
                <EmptyState title="Tidak ada laga terjadwal" />
              </Card>
            ) : (
              <div className="flex gap-3 -mx-4 px-4 pb-2 overflow-x-auto no-scrollbar snap-x-row">
                {upcoming.map((m) => (
                  <div key={m.id} className="bg-card p-4 border-2 border-line rounded-2xl w-60 shrink-0">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-fg-3 text-xs">{fmtDate(m.scheduled_at)}</span>
                      <Badge tone={MATCH_STATUS_TONES[m.status]}>{MATCH_STATUS_LABELS[m.status]}</Badge>
                    </div>
                    <p className="mt-3 font-display text-fg text-sm leading-snug" style={{ fontWeight: 900 }}>
                      {m.home_name}
                    </p>
                    <p className="my-1 font-black text-[10px] text-fg-4 uppercase tracking-widest">vs</p>
                    <p className="font-display text-fg text-sm leading-snug" style={{ fontWeight: 900 }}>
                      {m.away_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="gap-4 grid lg:grid-cols-2">
            <Card>
              <CardHeader title="Hasil terbaru" description="Pertandingan resmi" />
              {recent.length === 0 ? (
                <EmptyState title="Belum ada hasil resmi" />
              ) : (
                <ul className="divide-y-2 divide-line">
                  {recent.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-7 font-black text-fg-4 text-xs shrink-0">P{m.week}</span>
                      <p className="flex-1 min-w-0 font-bold text-fg text-sm truncate">{m.home_name}</p>
                      <span className="bg-soft-2 px-2.5 py-1 rounded-lg font-display font-black text-fg text-sm">
                        {m.home_score} – {m.away_score}
                      </span>
                      <p className="flex-1 min-w-0 font-bold text-fg text-sm text-right truncate">{m.away_name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Klasemen"
                description="Dihitung dari pertandingan resmi"
                actions={<Volleyball size={17} className="text-fg-3" />}
              />
              <div className="p-2">
                <StandingsTable rows={data.standings} compact />
              </div>
            </Card>
          </div>

          <Link to="/auth/login" className="btn btn-secondary btn-md w-full">
            Masuk untuk melihat data pribadimu <ChevronRight size={15} />
          </Link>
        </section>
      )}
    </div>
  );
}
