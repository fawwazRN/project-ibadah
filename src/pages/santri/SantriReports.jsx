import { useCallback, useEffect, useState } from "react";
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
import { reportService } from "../../services/reportService";
import { fmtDateTime, timeAgo } from "../../lib/date";

export default function SantriReports() {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    reportService
      .listMine()
      .then(setReports)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!reports) return <LoadingState rows={4} />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Laporan Saya"
        description="Klarifikasi yang kamu ajukan beserta hasil tinjauan OSIS."
        actions={
          <Button variant="secondary" onClick={load}>
            Muat ulang
          </Button>
        }
      />

      {reports.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareWarning}
            title="Belum ada laporan"
            description="Buka menu Pelanggaran Saya lalu tekan tombol “Klarifikasi” pada pelanggaran yang menurutmu kurang tepat."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <p className="font-display font-semibold text-slate-100 text-sm">
                    {r.violation?.rule?.name}
                  </p>
                  <p className="mt-0.5 text-slate-500 text-xs">
                    Pelanggaran {fmtDateTime(r.violation?.occurred_at)} ·
                    diajukan {timeAgo(r.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="rose">+{r.violation?.rule?.points} poin</Badge>
                  <ReportStatusBadge status={r.status} />
                </div>
              </div>
              <p className="mt-3 pl-3 border-brand/40 border-l-2 text-slate-400 text-sm leading-relaxed">
                <span className="font-medium text-slate-500 text-xs uppercase tracking-wider">
                  {r.reason}
                </span>
                <br />
                {r.explanation}
              </p>
              {["accepted", "rejected"].includes(r.status) && (
                <div className="bg-white/[0.02] mt-3 p-3 border border-white/[0.06] rounded-xl text-slate-400 text-xs">
                  <span className="font-semibold text-slate-300">
                    Hasil tinjauan:{" "}
                  </span>
                  {r.review_note || "—"}
                  {r.reviewer?.full_name && (
                    <span className="text-slate-600">
                      {" "}
                      · {r.reviewer.full_name}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600">
                Status pelanggaran saat ini:{" "}
                <ViolationStatusBadge status={r.violation?.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
