import { useCallback, useEffect, useState } from "react";
import { Flag, Plus, CheckCheck, Ban } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
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
import { ViolationFormModal } from "../../components/violations/ViolationFormModal";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { violationService } from "../../services/violationService";
import { ruleService } from "../../services/ruleService";
import { fmtOccurred } from "../../lib/date";

const STATUS_TABS = [
  ["active", "Aktif"],
  ["confirmed", "Terbukti"],
  ["revoked", "Dibatalkan"],
  ["reported", "Dilaporkan"],
  ["under_review", "Ditinjau"],
  ["", "Semua"],
];

export default function RiyadhahViolationsPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [violations, setViolations] = useState(null);
  const [rules, setRules] = useState([]);
  const [fStatus, setFStatus] = useState("active");
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([violationService.list(), ruleService.list()])
      .then(([v, r]) => {
        setViolations(v);
        setRules(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const confirmViolation = async (v) => {
    const rule = rules.find((r) => r.id === v.rule_id);
    const susp = rule?.creates_suspension;
    const ok = await confirm({
      title: "Konfirmasi pelanggaran?",
      message: susp
        ? `“${v.rule?.name}” membawa suspensi ${rule.suspension_weeks} pekan. Setelah dikonfirmasi, ${v.santri?.full_name} LANGSUNG tidak bisa bermain hingga periode berakhir.`
        : `“${v.rule?.name}” tidak membawa suspensi — hanya poin yang tercatat.`,
      confirmText: "Ya, konfirmasi",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(v.id);
    try {
      await violationService.updateStatus(v.id, "confirmed");
      push(
        "success",
        "Pelanggaran dikonfirmasi",
        susp
          ? `${v.santri?.full_name} ter-suspensi ${rule.suspension_weeks} pekan.`
          : undefined,
      );
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    } finally {
      setBusyId(null);
    }
  };

  // Batalkan → revoked; suspensi aktif otomatis dicabut oleh trigger database
  const revokeViolation = async (v) => {
    const ok = await confirm({
      title: "Batalkan pelanggaran?",
      message: `“${v.rule?.name}” atas nama ${v.santri?.full_name} akan dibatalkan (status: Dibatalkan). Bila sudah ada suspensi aktif dari pelanggaran ini, suspensinya OTOMATIS dibatalkan dan pemain bisa bermain lagi. Riwayat tetap tersimpan.`,
      confirmText: "Ya, batalkan",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(v.id);
    try {
      await violationService.updateStatus(v.id, "revoked");
      push("success", "Pelanggaran dibatalkan", v.santri?.full_name);
      load();
    } catch (e) {
      push("error", "Gagal membatalkan", e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!violations) return <LoadingState rows={8} />;

  // Hanya pelanggaran ranah Riyadhah
  const scoped = violations.filter((v) => v.rule?.scope === "riyadhah");
  const list = fStatus ? scoped.filter((v) => v.status === fStatus) : scoped;
  const suspendedRules = new Set(
    rules.filter((r) => r.creates_suspension).map((r) => r.id),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pelanggaran & Suspensi"
        description="Catat pelanggaran ranah Qism Riyadhah. Konfirmasi = pemicu suspensi otomatis. Batalkan = pemain bebas kembali (suspensinya ikut dicabut otomatis)."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setFormOpen(true)}>
            Catat Pelanggaran
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {STATUS_TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFStatus(k)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              fStatus === k
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}>
            {l}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Daftar Pelanggaran"
          description={`${list.length} catatan`}
        />
        {list.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Tidak ada pelanggaran"
            description="Belum ada data ranah Riyadhah pada filter ini."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Santri</Th>
                  <Th>Aturan</Th>
                  <Th>Poin</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 100).map((v) => (
                  <Tr key={v.id}>
                    <Td className="text-slate-400 whitespace-nowrap">
                      {fmtOccurred(v)}
                    </Td>
                    <Td className="text-slate-200">
                      {v.santri?.full_name}
                      <span className="ml-1.5 text-slate-500 text-xs">
                        {v.santri?.class_name}
                      </span>
                    </Td>
                    <Td className="text-slate-300">
                      {v.rule?.name}
                      {suspendedRules.has(v.rule_id) && (
                        <Badge tone="violet" className="ml-2">
                          ber-suspensi
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge tone="rose">+{v.rule?.points}</Badge>
                    </Td>
                    <Td>
                      <ViolationStatusBadge status={v.status} />
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        {v.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="dangerSoft"
                              icon={CheckCheck}
                              loading={busyId === v.id}
                              onClick={() => confirmViolation(v)}>
                              Konfirmasi
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={Ban}
                              loading={busyId === v.id}
                              onClick={() => revokeViolation(v)}>
                              Batalkan
                            </Button>
                          </>
                        )}
                        {v.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Ban}
                            loading={busyId === v.id}
                            onClick={() => revokeViolation(v)}>
                            Batalkan
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <ViolationFormModal
        open={formOpen}
        scope="riyadhah"
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
