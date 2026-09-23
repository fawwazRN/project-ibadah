import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { ViolationDetailModal } from "../../components/violations/ViolationDetailModal";
import { ReportModal } from "../../components/violations/ReportModal";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import { OPEN_STATUSES } from "../../lib/calc";
import { fmtDateTime } from "../../lib/date";

const FILTERS = [
  { key: "", label: "Semua" },
  { key: "active", label: "Aktif" },
  { key: "reported", label: "Dilaporkan" },
  { key: "under_review", label: "Ditinjau" },
  { key: "confirmed", label: "Terbukti" },
  { key: "revoked", label: "Dibatalkan" },
];

export default function SantriViolations() {
  const [violations, setViolations] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([violationService.list(), reportService.listMine()])
      .then(([v, r]) => {
        setViolations(v);
        setReports(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const openReportIds = useMemo(
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

  const counts = FILTERS.reduce(
    (m, f) => ({
      ...m,
      [f.key]: !f.key
        ? violations.length
        : violations.filter((v) => v.status === f.key).length,
    }),
    {},
  );
  const list = filter
    ? violations.filter((v) => v.status === filter)
    : violations;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pelanggaran Saya"
        description="Seluruh catatan pelanggaran yang tercatat pada namamu."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}>
            {f.label}{" "}
            <span className="ml-1 font-mono text-[10px] text-slate-500">
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Tidak ada data"
            description="Belum ada pelanggaran pada filter ini."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Aturan</Th>
                  <Th>Poin</Th>
                  <Th>Status</Th>
                  <Th>Catatan</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <Tr key={v.id}>
                    <Td className="text-slate-400 whitespace-nowrap">
                      {fmtDateTime(v.occurred_at)}
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-200">
                        {v.rule?.name}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {v.rule?.category}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone="rose">+{v.rule?.points}</Badge>
                    </Td>
                    <Td>
                      <ViolationStatusBadge status={v.status} />
                    </Td>
                    <Td className="max-w-[200px] text-slate-500 text-xs truncate">
                      {v.note || "—"}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        {OPEN_STATUSES.includes(v.status) &&
                          !openReportIds.has(v.id) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReportTarget(v)}>
                              Klarifikasi
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(v)}>
                          Detail
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <ViolationDetailModal
        violation={detail}
        open={!!detail}
        onClose={() => setDetail(null)}
        onClarify={(v) => {
          setDetail(null);
          setReportTarget(v);
        }}
      />
      <ReportModal
        open={!!reportTarget}
        violation={reportTarget}
        onClose={() => setReportTarget(null)}
        onSubmitted={load}
      />
    </div>
  );
}
