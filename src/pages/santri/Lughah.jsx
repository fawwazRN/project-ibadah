import { useCallback, useEffect, useState } from "react";
import {
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { lughahService } from "../../services/lughahService";

const REQ = [
  { key: "sudah_setor", label: "Sudah setor" },
  { key: "sudah_tanda_tangan", label: "Sudah tanda tangan" },
  { key: "sudah_bawa_buku", label: "Sudah bawa buku" },
  { key: "sudah_lengkap_tulisan", label: "Sudah lengkap tulisan" },
];

export default function SantriLughahPage() {
  const [periods, setPeriods] = useState(null);
  const [periodId, setPeriodId] = useState(null);
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const ps = await lughahService.listPeriods();
      setPeriods(ps);
      const pick = ps.find((p) => p.is_current) ?? ps[0];
      if (pick) {
        setPeriodId(pick.id);
        const rec = await lughahService.myRecord(pick.id);
        setRecord(rec);
      }
    })().catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <ErrorState message={error} onRetry={() => window.location.reload()} />
    );
  if (!periods || !record) return <LoadingState rows={5} />;

  return (
    <div className="space-y-5 max-w-2xl animate-fade-up">
      <PageHeader
        title="Kelengkapan & Nilai"
        description={`Periode: ${record.period_name}. Data ini diatur oleh Qism Lughah.`}
      />

      <Card>
        <CardHeader
          title="Kelengkapan Ujian"
          actions={
            record.is_complete ? (
              <Badge tone="emerald">
                <CheckCircle2 size={11} /> Lengkap
              </Badge>
            ) : (
              <Badge tone="amber">
                <AlertTriangle size={11} /> Belum Lengkap
              </Badge>
            )
          }
        />
        <ul className="divide-y divide-white/[0.04]">
          {REQ.map((r) => (
            <li key={r.key} className="flex items-center gap-3 px-5 py-3">
              {record[r.key] ? (
                <span className="place-items-center grid bg-emerald-400/15 border border-emerald-400/40 rounded-md size-6 text-emerald-300">
                  <Check size={13} />
                </span>
              ) : (
                <span className="place-items-center grid bg-white/[0.03] border border-white/15 rounded-md size-6 text-slate-600">
                  <X size={13} />
                </span>
              )}
              <span
                className={`text-sm ${record[r.key] ? "text-slate-200" : "text-slate-500"}`}>
                {r.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4">
          {record.is_complete ? (
            <p className="font-medium text-emerald-300 text-sm">
              Kelengkapanmu LENGKAP. Barakallah.
            </p>
          ) : (
            <p className="font-medium text-amber-300 text-sm">
              Kelengkapanmu BELUM LENGKAP — segera lengkapi syarat yang kurang.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Nilai"
          description="Nilai ujian yang telah diinput Qism Lughah"
        />
        <div className="p-5 text-center">
          {record.score != null ? (
            <>
              <p
                className={`font-display text-5xl font-bold ${record.score >= 75 ? "text-emerald-300" : record.score >= 60 ? "text-amber-300" : "text-rose-300"}`}>
                {record.score}
              </p>
              <p className="flex justify-center items-center gap-1.5 mt-1 text-slate-500 text-xs">
                <ClipboardCheck size={12} /> Sudah dinilai
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">
              Belum dinilai — nilai akan muncul setelah Qism Lughah menginput.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
