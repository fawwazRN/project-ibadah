import { useCallback, useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { SUSPENSION_LABELS } from "../../lib/constants";
import { suspensionService } from "../../services/suspensionService";
import { fmtDate } from "../../lib/date";

const TONES = { active: "rose", completed: "neutral", cancelled: "emerald" };
const TABS = ["", "active", "completed", "cancelled"];

export default function RiyadhahSuspensionsPage({ role = "qism_riyadhah" }) {
  const canCancel = role === "qism_ibadah" || role === "super_admin";
  const { push } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    suspensionService
      .list()
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const cancel = async (s) => {
    const ok = await confirm({
      title: "Batalkan suspensi?",
      message: `${s.full_name} dapat kembali bermain. Riwayat tetap tersimpan dengan status Dibatalkan.`,
      confirmText: "Ya, batalkan",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await suspensionService.cancel(s.id, s.full_name);
      push("success", "Suspensi dibatalkan", s.full_name);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <LoadingState rows={6} />;

  const list = tab ? rows.filter((r) => r.status === tab) : rows;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Suspensi Pemain"
        description="Suspensi dibuat otomatis saat pelanggaran berstatus Terbukti (aturan dengan suspensi). Pemain aktif ter-suspensi tidak bisa diturunkan bermain."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}>
            {t === "" ? "Semua" : SUSPENSION_LABELS[t]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Daftar Suspensi"
          description={`${list.length} catatan`}
        />
        {list.length === 0 ? (
          <EmptyState icon={Ban} title="Tidak ada suspensi" />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm">
                    {s.full_name}
                    <span className="ml-2 text-slate-500 text-xs">
                      {s.class_name}
                    </span>
                  </p>
                  <p className="text-slate-500 text-xs truncate">{s.reason}</p>
                </div>
                <p className="text-slate-400 text-xs">
                  {fmtDate(s.start_date)} — {fmtDate(s.end_date)} ·{" "}
                  {s.duration_weeks} pekan
                </p>
                <Badge tone={TONES[s.status]}>
                  {SUSPENSION_LABELS[s.status]}
                </Badge>
                {canCancel && s.status === "active" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => cancel(s)}>
                    Batalkan
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
