import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  Flag,
  Footprints,
  MessageSquareWarning,
  MoonStar,
  PartyPopper,
  Repeat,
  Volleyball,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudentData } from "../../layouts/StudentShell";
import { supabase } from "../../lib/supabaseClient";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Mascot } from "../../components/ui/Mascot";
import { BkMascot } from "../../components/ui/BkMascot";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { ReportModal } from "../../components/violations/ReportModal";
import { activityService } from "../../services/activityService";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { lughahService } from "../../services/lughahService";
import { nyekerService } from "../../services/nyekerService";
import { computeStandings } from "../../utils/standings";
import { OPEN_STATUSES, fmtNum } from "../../lib/calc";
import { fmtDate, hijriToday } from "../../lib/date";

const ACT_META = {
  shalat_berjamaah: { icon: MoonStar, label: "Shalat berjamaah" },
  zikir: { icon: Repeat, label: "Zikir" },
  tadarus: { icon: BookOpen, label: "Tadarus" },
};

const LUGHAH_FIELDS = [
  ["sudah_setor", "setor"],
  ["sudah_tanda_tangan", "tanda tangan"],
  ["sudah_bawa_buku", "bawa buku"],
  ["sudah_lengkap_tulisan", "lengkapi tulisan"],
];

// ---------- cincin skor ----------
function Ring({ value, size = 140, stroke = 12, color = "var(--color-brand)", children }) {
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(value), 150);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * v) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 place-items-center grid text-center">{children}</div>
    </div>
  );
}

// ---------- satu simpul di jalur ----------
function PathNode({ q, to, icon: Icon, label, sub, ring, offset }) {
  return (
    <Link
      to={to}
      className={`${q} group flex flex-col items-center`}
      style={{ transform: `translateX(${offset}px)` }}>
      <span className="relative">
        {ring != null && (
          <svg viewBox="0 0 104 104" className="-inset-[10px] absolute size-[104px] -rotate-90 pointer-events-none">
            <circle cx="52" cy="52" r="48" fill="none" stroke="var(--color-line)" strokeWidth="6" />
            <circle
              cx="52"
              cy="52"
              r="48"
              fill="none"
              stroke="var(--q)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - ring / 100)}
            />
          </svg>
        )}
        <span className="node">
          <Icon size={34} strokeWidth={2.4} />
        </span>
      </span>
      <span className="mt-4 font-display text-fg text-[15px]" style={{ fontWeight: 900 }}>
        {label}
      </span>
      <span className="font-semibold text-fg-3 text-xs">{sub}</span>
    </Link>
  );
}

function Connector({ shift }) {
  return (
    <div
      aria-hidden="true"
      className="mx-auto my-2 border-line-2 border-l-4 border-dotted w-0 h-9"
      style={{ transform: `translateX(${shift}px)` }}
    />
  );
}

// ---------- satu baris misi ----------
function Mission({ q, icon: Icon, title, sub, action, to }) {
  const body = (
    <>
      <span className={`${q} q-chip rounded-2xl size-11 shrink-0`}>
        <Icon size={21} strokeWidth={2.4} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-fg text-sm leading-snug">{title}</p>
        {sub && <p className="mt-0.5 font-semibold text-fg-3 text-xs">{sub}</p>}
      </div>
    </>
  );
  return (
    <li className="flex items-center gap-3 p-3.5">
      {body}
      {action ? (
        <Button size="sm" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : (
        to && (
          <Link to={to} className="btn btn-secondary btn-sm">
            Buka
          </Link>
        )
      )}
    </li>
  );
}

export default function SantriDashboard() {
  const { profile } = useAuth();
  const { violations, reports, error, stats, reload } = useStudentData();

  const [summary, setSummary] = useState({});
  const [league, setLeague] = useState(null);
  const [lughah, setLughah] = useState(null);
  const [nyeker, setNyeker] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  // Data tambahan (gagal-aman: tidak boleh merusak Beranda)
  const loadExtras = useCallback(() => {
    activityService
      .monthlySummary(profile.id)
      .then(setSummary)
      .catch(() => setSummary({}));

    (async () => {
      try {
        const ctx = await leagueService.getContext();
        const [teams, matches, mine] = await Promise.all([
          leagueService.listTeams(ctx.phase_id),
          matchService.list(ctx.season_id),
          supabase.rpc("get_santri_league"),
        ]);
        const rows = computeStandings(
          teams,
          matches.filter((m) => m.status === "official"),
        );
        setLeague({ ctx, rows, matches, myTeamId: mine.data?.team?.id ?? null });
      } catch {
        setLeague(null);
      }
    })();

    (async () => {
      try {
        const periods = await lughahService.listPeriods();
        const pick = periods.find((p) => p.is_current) ?? periods[0];
        setLughah(pick ? await lughahService.myRecord(pick.id) : null);
      } catch {
        setLughah(null);
      }
    })();

    nyekerService
      .list()
      .then((n) => setNyeker(n ?? []))
      .catch(() => setNyeker([]));
  }, [profile.id]);
  useEffect(loadExtras, [loadExtras]);

  const refresh = () => {
    reload();
    loadExtras();
  };

  const reportedIds = useMemo(
    () =>
      new Set(
        (reports ?? [])
          .filter((r) => ["pending", "reviewing"].includes(r.status))
          .map((r) => r.violation_id),
      ),
    [reports],
  );

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!violations) return <LoadingState rows={6} />;

  const now = new Date();
  const open = violations.filter((v) => OPEN_STATUSES.includes(v.status));
  const unreported = open.filter((v) => !reportedIds.has(v.id));
  const recent = violations.slice(0, 4);
  const { score, activePts, cleanDays } = stats;

  const unpaid = (nyeker ?? []).filter((r) => !r.fine_paid);
  const unpaidTotal = unpaid.reduce((s, r) => s + (r.fine_amount ?? 5000), 0);
  const lughahDone = lughah
    ? LUGHAH_FIELDS.filter(([k]) => lughah[k]).length
    : null;
  const lughahMissing = lughah
    ? LUGHAH_FIELDS.filter(([k]) => !lughah[k]).map(([, l]) => l)
    : [];

  const myRow = league?.rows.findIndex((r) => r.team_id === league.myTeamId);
  const myTeam = myRow != null && myRow >= 0 ? league.rows[myRow] : null;
  const nextMatch =
    myTeam &&
    league.matches
      .filter(
        (m) =>
          ["scheduled", "postponed"].includes(m.status) &&
          (m.home_name === myTeam.name || m.away_name === myTeam.name),
      )
      .sort((a, b) => new Date(a.scheduled_at ?? 0) - new Date(b.scheduled_at ?? 0))[0];

  // ---------- Misi: hanya hal NYATA yang perlu dilakukan ----------
  const missions = [];
  unreported.slice(0, 2).forEach((v) =>
    missions.push({
      key: `k-${v.id}`,
      q: "q-ibadah",
      icon: MessageSquareWarning,
      title: `Ajukan klarifikasi: ${v.rule?.name}`,
      sub: `+${v.rule?.points} poin · ${fmtDate(v.occurred_at)}`,
      action: { label: "Klarifikasi", onClick: () => setReportTarget(v) },
    }),
  );
  if (unreported.length > 2)
    missions.push({
      key: "k-more",
      q: "q-ibadah",
      icon: Flag,
      title: `${unreported.length - 2} pelanggaran lain menunggu klarifikasi`,
      to: "/santri/violations",
    });
  if (unpaid.length > 0)
    missions.push({
      key: "fine",
      q: "q-nadzhofah",
      icon: Wallet,
      title: `Lunasi denda nyeker Rp ${fmtNum(unpaidTotal)}`,
      sub: `${unpaid.length} catatan belum lunas`,
      to: "/santri/nadzhofah",
    });
  if (lughah && lughahMissing.length > 0)
    missions.push({
      key: "lughah",
      q: "q-lughah",
      icon: BookOpenCheck,
      title: `Lengkapi Lughah: ${lughahMissing.join(", ")}`,
      sub: `${lughahDone} dari 4 sudah beres`,
      to: "/santri/lughah",
    });
  if (nextMatch)
    missions.push({
      key: "match",
      q: "q-riyadhah",
      icon: CalendarDays,
      title: `${nextMatch.home_name} vs ${nextMatch.away_name}`,
      sub: `Laga timmu · ${nextMatch.scheduled_at ? fmtDate(nextMatch.scheduled_at) : "jadwal menyusul"}`,
      to: "/santri/team",
    });

  const mood = activePts === 0 ? "cheer" : activePts <= 3 ? "happy" : "worried";
  const firstName = (profile.full_name ?? "").split(" ")[0];
  const bubble =
    activePts === 0
      ? cleanDays == null
        ? "Catatanmu bersih. Pertahankan, ya!"
        : `${cleanDays} hari tanpa pelanggaran. Keren!`
      : activePts <= 3
        ? `Ada ${activePts} poin aktif. Masih bisa diperbaiki!`
        : `${activePts} poin aktif. Yuk cek catatanmu.`;

  return (
    <div className="gap-6 grid lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ============ KOLOM UTAMA ============ */}
      <div className="space-y-6 min-w-0">
        {/* Sapaan + maskot */}
        <section className="flex items-center gap-3 sm:gap-5">
          <Mascot mood={mood} size={104} wave className="shrink-0 animate-float" />
          <div className="relative bg-card p-4 border-2 border-line rounded-3xl min-w-0">
            <span className="top-1/2 -left-[9px] absolute bg-card border-line border-b-2 border-l-2 size-4 -rotate-45 -translate-y-1/2" />
            <p className="font-bold text-fg-3 text-xs">
              {hijriToday() && <>{hijriToday()} · </>}
              {fmtDate(now)}
            </p>
            <h2 className="mt-0.5 font-display text-fg text-xl leading-tight" style={{ fontWeight: 900 }}>
              Assalamu’alaikum, {firstName}!
            </h2>
            <p className="mt-1 font-semibold text-fg-2 text-sm">{bubble}</p>
          </div>
        </section>

        {/* Ngobrol dengan Kak Peci */}
        <Link
          to="/santri/bk"
          className="flex items-center gap-3 bg-tint p-3 pr-4 border-2 border-tint-line rounded-3xl active:translate-y-0.5 transition-transform">
          <BkMascot mood="care" size={56} />
          <span className="min-w-0">
            <span className="block font-extrabold text-brand-dim text-[15px]">Lagi ada yang dipikirkan?</span>
            <span className="block text-fg-2 text-sm">Ngobrol santai dengan Kak Peci</span>
          </span>
        </Link>

        {/* Misi hari ini */}
        <section aria-labelledby="misi">
          <h2 id="misi" className="mb-3 font-display text-fg text-lg" style={{ fontWeight: 900 }}>
            Misi hari ini
          </h2>
          <Card>
            {missions.length === 0 ? (
              <div className="flex items-center gap-4 p-5">
                <span className="q-gold q-chip rounded-2xl size-12 shrink-0">
                  <PartyPopper size={24} strokeWidth={2.3} />
                </span>
                <div>
                  <p className="font-extrabold text-fg">Semua beres!</p>
                  <p className="font-semibold text-fg-3 text-sm">
                    Tidak ada yang perlu kamu urus sekarang. Barakallah.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y-2 divide-line">
                {missions.map((m) => (
                  <Mission key={m.key} {...m} />
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Jalur qism */}
        <section aria-labelledby="jalur">
          <h2 id="jalur" className="mb-1 font-display text-fg text-lg" style={{ fontWeight: 900 }}>
            Jalur Qism
          </h2>
          <p className="font-semibold text-fg-3 text-sm">Ketuk untuk membuka tiap qism.</p>
          <div className="py-8">
            <PathNode
              q="q-ibadah"
              to="/santri/zikir"
              icon={MoonStar}
              label="Ibadah"
              sub={`Skor ${score}`}
              ring={score}
              offset={0}
            />
            <Connector shift={28} />
            <PathNode
              q="q-nadzhofah"
              to="/santri/nadzhofah"
              icon={Footprints}
              label="Nadzhofah"
              sub={
                nyeker == null
                  ? "Memuat…"
                  : nyeker.length === 0
                    ? "Bersih"
                    : `${nyeker.length} nyeker`
              }
              offset={56}
            />
            <Connector shift={28} />
            <PathNode
              q="q-lughah"
              to="/santri/lughah"
              icon={BookOpenCheck}
              label="Lughah"
              sub={lughah ? `${lughahDone}/4 lengkap` : "Belum ada data"}
              ring={lughah ? (lughahDone / 4) * 100 : null}
              offset={0}
            />
            <Connector shift={-28} />
            <PathNode
              q="q-riyadhah"
              to="/santri/team"
              icon={Volleyball}
              label="Riyadhah"
              sub={myTeam ? `Peringkat ${myRow + 1}` : "Tim & laga"}
              offset={-56}
            />
          </div>
        </section>
      </div>

      {/* ============ KOLOM SAMPING ============ */}
      <div className="space-y-6 min-w-0">
        <Card className="p-5">
          <p className="font-extrabold text-[11px] text-fg-3 text-center uppercase tracking-widest">
            Skor kepatuhan ibadah
          </p>
          <div className="mt-4">
            <Ring value={score} color={score >= 80 ? "var(--color-brand)" : score >= 60 ? "#f59e0b" : "#ef4444"}>
              <div>
                <p className="font-display text-fg text-4xl leading-none" style={{ fontWeight: 900 }}>
                  {score}
                </p>
                <p className="mt-1 font-bold text-[10px] text-fg-3 uppercase tracking-widest">dari 100</p>
              </div>
            </Ring>
          </div>
          <p className="mt-3 font-semibold text-fg-3 text-xs text-center">
            Dihitung dari {fmtNum(activePts)} poin aktif
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-4 pt-4 border-line border-t-2">
            {Object.keys(summary).length === 0 && (
              <span className="font-semibold text-fg-3 text-xs">Belum ada aktivitas bulan ini</span>
            )}
            {Object.entries(summary).map(([k, n]) => {
              const m = ACT_META[k] ?? { icon: Flag, label: k };
              return (
                <Badge key={k} tone="brand">
                  <m.icon size={11} /> {m.label} {fmtNum(n)}×
                </Badge>
              );
            })}
          </div>
        </Card>

        {league && (
          <Card>
            <CardHeader
              title="Klasemen Liga"
              description={`${league.ctx.phase_name} · ${league.ctx.season_name}`}
              actions={
                <Link to="/santri/standings" className="btn btn-ghost btn-sm">
                  Lengkap <ChevronRight size={14} />
                </Link>
              }
            />
            {league.rows.length === 0 ? (
              <EmptyState icon={Volleyball} title="Belum ada laga resmi" />
            ) : (
              <ul className="divide-y-2 divide-line">
                {league.rows.slice(0, 5).map((r, i) => {
                  const mine = r.team_id === league.myTeamId;
                  return (
                    <li
                      key={r.team_id}
                      className={`flex items-center gap-3 px-4 py-3 ${mine ? "bg-tint" : ""}`}>
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-black ${
                          i === 0 ? "bg-gold text-[#3b2a00]" : "bg-soft-2 text-fg-3"
                        }`}>
                        {i + 1}
                      </span>
                      <p className="flex-1 min-w-0 font-extrabold text-fg text-sm truncate">
                        {r.name}
                        {mine && (
                          <span className="bg-brand ml-2 px-1.5 py-0.5 rounded-full font-extrabold text-[9px] text-on-brand uppercase tracking-wider">
                            Timku
                          </span>
                        )}
                      </p>
                      <span className="font-display font-black text-fg text-sm">{fmtNum(r.points)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        <Card>
          <CardHeader
            title="Catatan terbaru"
            actions={
              <Link to="/santri/violations" className="btn btn-ghost btn-sm">
                Semua <ChevronRight size={14} />
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState icon={Flag} title="Belum ada pelanggaran" description="Tetap jaga disiplin ibadahmu. Barakallah." />
          ) : (
            <ul className="divide-y-2 divide-line">
              {recent.map((v) => (
                <li key={v.id} className="px-4 py-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-extrabold text-fg text-sm leading-snug">{v.rule?.name}</p>
                    <Badge tone="rose">+{v.rule?.points}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="font-semibold text-fg-3 text-xs">{fmtDate(v.occurred_at)}</span>
                    <ViolationStatusBadge status={v.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="gap-3 grid grid-cols-2">
          <Link to="/santri/recap" className="p-4 card-press">
            <p className="font-extrabold text-fg text-sm">Rekap pribadi</p>
            <p className="mt-0.5 font-semibold text-fg-3 text-xs">Ringkasan per periode</p>
          </Link>
          <Link to="/santri/reports" className="p-4 card-press">
            <p className="font-extrabold text-fg text-sm">Laporanku</p>
            <p className="mt-0.5 font-semibold text-fg-3 text-xs">Status klarifikasi</p>
          </Link>
        </div>
      </div>

      <ReportModal
        open={!!reportTarget}
        violation={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitted={refresh}
      />
    </div>
  );
}
