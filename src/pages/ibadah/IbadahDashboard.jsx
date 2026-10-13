import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  Flag,
  MessageSquareWarning,
  Plus,
  Users,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { AreaPerDay } from "../../components/dashboard/Charts";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import {
  OPEN_STATUSES,
  fmtNum,
  pointsInRange,
  seriesPerDay,
  sumPoints,
} from "../../lib/calc";
import { endOfDay, fmtOccurred, startOfDay, startOfMonth, startOfWeek } from "../../lib/date";

// Dashboard Qism Ibadah: dari "apa yang perlu ditindak" → tren → siapa yang perlu didampingi.
export default function IbadahDashboard() {
  const [violations, setViolations] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([violationService.list(), reportService.listAll()])
      .then(([v, r]) => {
        setViolations(v);
        setReports(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const d = useMemo(() => {
    if (!violations) return null;
    const scoped = violations.filter((v) => v.rule?.scope === "ibadah");
    const now = new Date();
    const today = scoped.filter(
      (v) => new Date(v.occurred_at) >= startOfDay() && new Date(v.occurred_at) <= endOfDay(),
    );
    const weekPts = pointsInRange(scoped, [startOfWeek(), now]);
    const month = scoped.filter(
      (v) => v.status !== "revoked" && new Date(v.occurred_at) >= startOfMonth(),
    );
    // santri dengan poin aktif terbanyak
    const by = new Map();
    for (const v of scoped.filter((x) => OPEN_STATUSES.includes(x.status))) {
      const id = v.santri?.id ?? v.santri_id;
      const cur = by.get(id) ?? { name: v.santri?.full_name, cls: v.santri?.class_name, pts: 0, n: 0 };
      cur.pts += v.rule?.points ?? 0;
      cur.n += 1;
      by.set(id, cur);
    }
    const attention = [...by.values()].sort((a, b) => b.pts - a.pts).slice(0, 5);
    const pending = reports.filter((r) => ["pending", "reviewing"].includes(r.status));
    return {
      scoped,
      todayN: today.length,
      weekPts,
      monthStudents: new Set(month.map((v) => v.santri?.id ?? v.santri_id)).size,
      attention,
      pending,
      series: seriesPerDay(scoped, 14),
      latest: scoped.slice(0, 6),
      openPts: sumPoints(scoped.filter((v) => OPEN_STATUSES.includes(v.status))),
    };
  }, [violations, reports]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!d) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard Ibadah"
        description="Ringkasan pelanggaran ranah Ibadah dan hal yang perlu ditindak."
        actions={
          <Link to="/ibadah/violations?new=1" className="btn btn-primary btn-md">
            <Plus size={16} strokeWidth={2.4} /> Catat pelanggaran
          </Link>
        }
      />

      {d.pending.length > 0 && (
        <Link
          to="/ibadah/reports"
          className="flex items-center gap-3 bg-amber-50 hover:bg-amber-100/70 px-4 py-3 border border-amber-300/60 rounded-xl transition-colors">
          <AlertTriangle size={18} className="text-amber-700 shrink-0" />
          <p className="flex-1 font-semibold text-amber-900 text-sm">
            {d.pending.length} laporan klarifikasi menunggu tinjauanmu.
          </p>
          <span className="font-bold text-amber-800 text-xs">Tinjau →</span>
        </Link>
      )}

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard label="Hari ini" value={fmtNum(d.todayN)} icon={Flag} tone="rose" sub="pelanggaran tercatat" />
        <StatCard label="Poin pekan ini" value={fmtNum(d.weekPts)} icon={CalendarDays} tone="amber" />
        <StatCard label="Santri bulan ini" value={fmtNum(d.monthStudents)} icon={Users} sub="berpelanggaran" />
        <StatCard
          label="Laporan menunggu"
          value={fmtNum(d.pending.length)}
          icon={MessageSquareWarning}
          tone={d.pending.length ? "amber" : "emerald"}
        />
      </div>

      <div className="gap-4 grid lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tren 14 hari" description="Jumlah pelanggaran per hari" />
          <div className="p-4">
            <AreaPerDay data={d.series} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Perlu didampingi" description="Poin aktif terbanyak" />
          {d.attention.length === 0 ? (
            <EmptyState icon={Users} title="Tidak ada poin aktif" />
          ) : (
            <ul className="divide-y divide-line">
              {d.attention.map((s, i) => (
                <li key={`${s.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={s.name ?? ""} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-fg text-[13px] truncate">{s.name}</p>
                    <p className="text-fg-3 text-xs">Kelas {s.cls} · {s.n} kasus</p>
                  </div>
                  <Badge tone="rose">{s.pts} poin</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Pelanggaran terbaru"
          actions={
            <Link to="/ibadah/violations" className="btn btn-secondary btn-sm">
              Kelola semua
            </Link>
          }
        />
        {d.latest.length === 0 ? (
          <EmptyState icon={Flag} title="Belum ada pelanggaran" />
        ) : (
          <ul className="divide-y divide-line">
            {d.latest.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-[160px]">
                  <p className="font-semibold text-fg text-[13px]">{v.santri?.full_name}</p>
                  <p className="text-fg-3 text-xs">
                    {v.rule?.name} · {fmtOccurred(v)}
                  </p>
                </div>
                <Badge tone="rose">+{v.rule?.points}</Badge>
                <ViolationStatusBadge status={v.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
