import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Flag,
  CalendarDays,
  CalendarRange,
  MessageSquareWarning,
  ShieldAlert,
  TrendingUp,
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
import {
  AreaPerDay,
  BarsByRule,
  BarsWeekly,
  LineMonthly,
} from "../../components/dashboard/Charts";
import { ACTION_META } from "../../components/dashboard/actionMeta";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import { profileService } from "../../services/profileService";
import { auditService } from "../../services/auditService";
import {
  byRule,
  seriesPerDay,
  seriesPerWeek,
  seriesPerMonth,
  OPEN_STATUSES,
  fmtNum,
} from "../../lib/calc";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  daysAgo,
  timeAgo,
} from "../../lib/date";

export default function IbadahDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      violationService.list({ from: daysAgo(200) }),
      reportService.listAll(),
      profileService.listSantri(),
      auditService.list(),
    ])
      .then(([v, r, s, a]) => setData({ v, r, s, a }))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={8} />;

  const { v: violations, r: reports, s: santri, a: audit } = data;

  // Yang dibatalkan (klarifikasi diterima) tidak dihitung sebagai pelanggaran.
  const real = violations.filter((x) => x.status !== "revoked");
  const since = (d) => real.filter((x) => new Date(x.occurred_at) >= d).length;
  const topRule = byRule(
    real.filter((x) => new Date(x.occurred_at) >= startOfMonth()),
  )[0];

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Dashboard Admin"
        description="Pantauan menyeluruh aktivitas Qism Ibadah. Pelanggaran yang dibatalkan tidak dihitung."
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Santri"
          value={fmtNum(santri.length)}
          icon={Users}
        />
        <StatCard
          label="Hari Ini"
          value={fmtNum(since(startOfDay()))}
          icon={Flag}
          tone="amber"
        />
        <StatCard
          label="Pekan Ini"
          value={fmtNum(since(startOfWeek()))}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Bulan Ini"
          value={fmtNum(since(startOfMonth()))}
          icon={CalendarRange}
          tone="amber"
        />
        <StatCard
          label="Laporan Pending"
          value={fmtNum(
            reports.filter((x) => ["pending", "reviewing"].includes(x.status))
              .length,
          )}
          icon={MessageSquareWarning}
          tone="sky"
        />
        <StatCard
          label="Kasus Aktif"
          value={fmtNum(
            violations.filter((x) => OPEN_STATUSES.includes(x.status)).length,
          )}
          icon={ShieldAlert}
          tone="rose"
        />
      </div>

      {topRule && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <span className="place-items-center grid bg-amber-400/[0.06] border border-amber-400/20 rounded-lg size-9 text-amber-300">
            <TrendingUp size={16} />
          </span>
          <p className="text-slate-300 text-sm">
            Pelanggaran tersering bulan ini:{" "}
            <span className="font-semibold text-slate-100">{topRule.name}</span>{" "}
            <span className="text-slate-500">
              — {fmtNum(topRule.total)} kejadian · {fmtNum(topRule.poin)} poin
              total
            </span>
          </p>
          <Badge tone="rose" className="ml-auto">
            +{topRule.points} / kejadian
          </Badge>
        </Card>
      )}

      <div className="gap-4 grid lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Pelanggaran per hari"
            description="14 hari terakhir · tidak termasuk yang dibatalkan"
          />
          <div className="p-4">
            <AreaPerDay data={seriesPerDay(real, 14)} />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Berdasarkan aturan"
            description="6 aturan teratas — periode 200 hari"
          />
          <div className="p-4">
            {byRule(real).length === 0 ? (
              <EmptyState title="Belum ada data" />
            ) : (
              <BarsByRule data={byRule(real).slice(0, 6)} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Tren mingguan"
            description="8 pekan terakhir · Jumat–Kamis"
          />
          <div className="p-4">
            <BarsWeekly data={seriesPerWeek(real, 8)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Tren bulanan" description="6 bulan terakhir" />
          <div className="p-4">
            <LineMonthly data={seriesPerMonth(real, 6)} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Aktivitas terbaru"
          description="Jejak tindakan OSIS (log audit)"
        />
        {audit.length === 0 ? (
          <EmptyState icon={Flag} title="Belum ada aktivitas" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {audit.slice(0, 8).map((e) => {
              const m = ACTION_META[e.action] ?? {
                icon: Flag,
                label: e.action,
                tone: "neutral",
              };
              const Icon = m.icon;
              return (
                <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="place-items-center grid bg-white/[0.03] border border-white/[0.07] rounded-lg size-8 text-slate-400 shrink-0">
                    <Icon size={14} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 text-sm truncate">
                      <span className="font-medium text-slate-200">
                        {e.actor?.full_name}
                      </span>{" "}
                      — {m.label}
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      {e.target_label}
                    </p>
                  </div>
                  <span className="text-slate-600 text-xs shrink-0">
                    {timeAgo(e.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
