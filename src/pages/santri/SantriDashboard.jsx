import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flag,
  MessageSquareWarning,
  Trophy,
  FileBarChart,
  ChevronRight,
  MoonStar,
  Repeat,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { ReportModal } from "../../components/violations/ReportModal";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import { activityService } from "../../services/activityService";
import {
  OPEN_STATUSES,
  sumPoints,
  pointsInRange,
  fmtNum,
} from "../../lib/calc";
import { startOfWeek, startOfMonth, fmtDate, hijriToday } from "../../lib/date";

function ComplianceRing({ score }) {
  const R = 54,
    C = 2 * Math.PI * R;
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setVal(score), 150);
    return () => clearTimeout(t);
  }, [score]);
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#F43F5E";
  return (
    <div className="relative mx-auto size-40">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="9"
        />
        <circle
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * val) / 100}
          style={{
            transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 place-items-center grid text-center">
        <div>
          <p className="font-display font-semibold text-slate-50 text-3xl">
            {score}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            dari 100
          </p>
        </div>
      </div>
    </div>
  );
}

const ACT_META = {
  shalat_berjamaah: { icon: MoonStar, label: "Shalat berjamaah" },
  zikir: { icon: Repeat, label: "Zikir" },
  tadarus: { icon: BookOpen, label: "Tadarus" },
};

export default function SantriDashboard() {
  const { profile } = useAuth();
  const [violations, setViolations] = useState(null);
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      violationService.list(),
      reportService.listMine(),
      activityService.monthlySummary(profile.id),
    ])
      .then(([v, r, s]) => {
        setViolations(v);
        setReports(r);
        setSummary(s);
      })
      .catch((e) => setError(e.message));
  }, [profile.id]);
  useEffect(load, [load]);

  const openReportViolationIds = useMemo(
    () =>
      new Set(
        reports
          .filter((r) => ["pending", "reviewing"].includes(r.status))
          .map((r) => r.violation_id),
      ),
    [reports],
  );

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!violations) return <LoadingState rows={6} />;

  const now = new Date();
  const open = violations.filter((v) => OPEN_STATUSES.includes(v.status));
  const activePts = sumPoints(open);
  const weekPts = pointsInRange(violations, [startOfWeek(), now]);
  const monthPts = pointsInRange(violations, [startOfMonth(), now]);
  const pendingReports = reports.filter((r) =>
    ["pending", "reviewing"].includes(r.status),
  ).length;
  const score = Math.max(0, Math.min(100, 100 - activePts * 5));
  const recent = violations.slice(0, 5);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <p className="text-slate-500 text-sm">Assalamu’alaikum,</p>
        <h1 className="font-display font-semibold text-slate-50 text-2xl">
          {profile.full_name}
        </h1>
        <p className="mt-1 text-slate-500 text-xs">
          {hijriToday() && <>{hijriToday()} · </>}
          {fmtDate(now)} · Kelas {profile.class_name}
        </p>
      </div>

      <div className="gap-4 grid lg:grid-cols-3">
        <Card className="p-5">
          <p className="font-semibold text-[11px] text-slate-500 text-center uppercase tracking-widest">
            Skor Kepatuhan Ibadah
          </p>
          <div className="mt-4">
            <ComplianceRing score={score} />
          </div>
          <p className="mt-3 text-slate-500 text-xs text-center">
            Dihitung dari poin aktif saat ini ({fmtNum(activePts)} poin)
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4 pt-4 border-white/[0.06] border-t">
            {Object.entries(summary).length === 0 && (
              <span className="text-slate-600 text-xs">
                Belum ada aktivitas tercatat bulan ini
              </span>
            )}
            {Object.entries(summary).map(([k, n]) => {
              const m = ACT_META[k] ?? { icon: Flag, label: k };
              return (
                <Badge key={k} tone="emerald">
                  <m.icon size={11} /> {m.label} {fmtNum(n)}×
                </Badge>
              );
            })}
          </div>
        </Card>

        <div className="gap-4 grid grid-cols-2 lg:col-span-2">
          <StatCard
            label="Poin Aktif"
            value={fmtNum(activePts)}
            icon={Flag}
            tone={activePts > 0 ? "rose" : "emerald"}
            sub="Poin yang sedang berjalan"
          />
          <StatCard
            label="Poin Minggu Ini"
            value={fmtNum(weekPts)}
            icon={Flag}
            tone="amber"
          />
          <StatCard
            label="Poin Bulan Ini"
            value={fmtNum(monthPts)}
            icon={Flag}
            tone="amber"
          />
          <StatCard
            label="Pelanggaran Aktif"
            value={fmtNum(open.length)}
            icon={Flag}
            tone="default"
            sub={`${violations.length} total tercatat`}
          />
          <StatCard
            label="Laporan Berjalan"
            value={fmtNum(pendingReports)}
            icon={MessageSquareWarning}
            tone="sky"
            sub="Menunggu / sedang ditinjau"
          />
          <Link to="/santri/leaderboard" className="block">
            <Card className="p-4 hover:border-brand/30 h-full transition-colors">
              <div className="flex flex-col justify-between h-full">
                <Trophy size={18} className="text-brand-soft" />
                <div className="mt-3">
                  <p className="font-display font-semibold text-slate-100 text-sm">
                    Papan Peringkat Nakal
                  </p>
                  <p className="mt-0.5 text-slate-500 text-xs">
                    Top 10 poin pelanggaran bulan ini
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Pelanggaran Terbaru"
          description="5 catatan terakhir pada namamu"
          actions={
            <Link to="/santri/violations">
              <Button size="sm" variant="ghost" icon={ChevronRight}>
                Riwayat lengkap
              </Button>
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Belum ada pelanggaran"
            description="Tetap jaga kedisiplinan ibadahmu. Barakallah."
          />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {recent.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">
                    {v.rule?.name}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {fmtDate(v.occurred_at)} · {v.rule?.category}
                  </p>
                </div>
                <Badge tone="rose">+{v.rule?.points} poin</Badge>
                <ViolationStatusBadge status={v.status} />
                {OPEN_STATUSES.includes(v.status) &&
                  (openReportViolationIds.has(v.id) ? (
                    <Badge tone="sky">Klarifikasi diajukan</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setReportTarget(v)}>
                      Klarifikasi
                    </Button>
                  ))}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="gap-3 grid grid-cols-2 lg:grid-cols-3">
        {[
          {
            to: "/santri/reports",
            icon: MessageSquareWarning,
            title: "Laporan Saya",
            desc: "Pantau status klarifikasi",
          },
          {
            to: "/santri/recap",
            icon: FileBarChart,
            title: "Rekap Pribadi",
            desc: "Ringkasan per periode",
          },
          {
            to: "/santri/leaderboard",
            icon: Trophy,
            title: "Leaderboard",
            desc: "Skor ibadah positif",
          },
        ].map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="flex items-center gap-3 p-4 hover:border-brand/30 transition-colors">
              <span className="place-items-center grid bg-white/[0.03] border border-white/[0.07] rounded-lg size-9 text-brand-soft shrink-0">
                <c.icon size={16} />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-slate-200 text-sm truncate">
                  {c.title}
                </p>
                <p className="text-slate-500 text-xs truncate">{c.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <ReportModal
        open={!!reportTarget}
        violation={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitted={load}
      />
    </div>
  );
}
