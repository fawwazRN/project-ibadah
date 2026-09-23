import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import {
  ReportStatusBadge,
  ViolationStatusBadge,
} from "../../components/violations/StatusBadge";
import { ReportReviewModal } from "../../components/reports/ReportReviewModal";
import { reportService } from "../../services/reportService";
import { timeAgo } from "../../lib/date";

const TABS = [
  { key: "", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "reviewing", label: "Ditinjau" },
  { key: "accepted", label: "Diterima" },
  { key: "rejected", label: "Ditolak" },
];

export default function ReportsReview() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("pending");
  const [review, setReview] = useState(null);

  const load = useCallback(() => {
    setError(null);
    reportService
      .listAll()
      .then(setReports)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(
    () =>
      TABS.reduce(
        (m, t) => ({
          ...m,
          [t.key]: !t.key
            ? (reports?.length ?? 0)
            : (reports?.filter((r) => r.status === t.key).length ?? 0),
        }),
        {},
      ),
    [reports],
  );

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!reports) return <LoadingState rows={5} />;

  const list = tab ? reports.filter((r) => r.status === tab) : reports;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tinjau Laporan"
        description="Klarifikasi dari santri menunggu keputusanmu."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.key
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}>
            {t.label}{" "}
            <span className="ml-1 font-mono text-[10px] text-slate-500">
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareWarning}
            title="Tidak ada laporan"
            description="Belum ada laporan pada tab ini."
          />
        </Card>
      ) : (
        <div className="gap-3 grid lg:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-slate-100 text-sm">
                    {r.violation?.santri?.full_name ?? r.santri?.full_name}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Kelas {r.violation?.santri?.class_name} · diajukan{" "}
                    {timeAgo(r.created_at)}
                  </p>
                </div>
                <ReportStatusBadge status={r.status} />
              </div>
              <div className="flex justify-between items-center gap-2 bg-white/[0.02] mt-3 p-3 border border-white/[0.06] rounded-xl">
                <div className="min-w-0">
                  <p className="text-slate-200 text-sm truncate">
                    {r.violation?.rule?.name}
                  </p>
                  <p className="text-slate-500 text-xs">{r.reason}</p>
                </div>
                <Badge tone="rose">+{r.violation?.rule?.points}</Badge>
              </div>
              <p className="mt-3 pl-3 border-brand/40 border-l-2 text-slate-400 text-sm line-clamp-3 leading-relaxed">
                {r.explanation}
              </p>
              <div className="flex justify-between items-center gap-2 mt-4">
                <ViolationStatusBadge status={r.violation?.status} />
                {["pending", "reviewing"].includes(r.status) ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setReview(r)}>
                    Tinjau
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReview(r)}>
                    Lihat keputusan
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReportReviewModal
        report={review}
        open={!!review}
        onClose={() => setReview(null)}
        onChanged={load}
      />
    </div>
  );
}
