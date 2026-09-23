import { useEffect, useState } from "react";
import { Ban, Flag, Save } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Field";
import { ViolationStatusBadge } from "./StatusBadge";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { violationService } from "../../services/violationService";
import { OPEN_VIOLATION_STATUSES } from "../../lib/constants";

export function ViolationDetailModal({
  violation: v0,
  open,
  onClose,
  canManage = false,
  onChanged,
  onClarify,
}) {
  const [v, setV] = useState(v0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { push } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setV(v0);
    setNote(v0?.note ?? "");
  }, [v0]);
  if (!v) return null;
  const label = `${v.rule?.name} — ${v.santri?.full_name}`;

  const change = async (status, { title, message, confirmText, tone }) => {
    if (!(await confirm({ title, message, confirmText, tone }))) return;
    setSaving(true);
    try {
      const updated = await violationService.updateStatus(v.id, status, {
        label,
      });
      setV(updated);
      push("success", "Status diperbarui", label);
      onChanged?.();
    } catch (e) {
      push("error", "Gagal memperbarui status", e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    setSaving(true);
    try {
      const updated = await violationService.updateNote(v.id, note, { label });
      setV(updated);
      push("success", "Catatan disimpan");
      onChanged?.();
    } catch (e) {
      push("error", "Gagal menyimpan catatan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detail Pelanggaran">
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <p className="font-display font-semibold text-slate-100 text-base">
              {v.rule?.name}
            </p>
            <p className="mt-0.5 text-slate-500 text-xs">
              Kategori {v.rule?.category}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="rose">+{v.rule?.points} poin</Badge>
            <ViolationStatusBadge status={v.status} />
          </div>
        </div>

        <dl className="gap-3 grid grid-cols-2 text-sm">
          <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
            <dt className="text-[11px] text-slate-500 uppercase tracking-wider">
              Santri
            </dt>
            <dd className="mt-1 font-medium text-slate-200">
              {v.santri?.full_name}
            </dd>
            <dd className="text-slate-500 text-xs">
              Kelas {v.santri?.class_name ?? "—"}
            </dd>
          </div>
          <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
            <dt className="text-[11px] text-slate-500 uppercase tracking-wider">
              Waktu kejadian
            </dt>
            <dd className="mt-1 font-medium text-slate-200">
              {new Date(v.occurred_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </dd>
            <dd className="text-slate-500 text-xs">
              {new Date(v.occurred_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
        </dl>

        <div>
          <p className="mb-1 text-[11px] text-slate-500 uppercase tracking-wider">
            Catatan petugas
          </p>
          {canManage ? (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Belum ada catatan."
              />
              {note !== (v.note ?? "") && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Save}
                  loading={saving}
                  onClick={saveNote}>
                  Simpan catatan
                </Button>
              )}
            </div>
          ) : (
            <p className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl text-slate-400 text-sm">
              {v.note || "Belum ada catatan."}
            </p>
          )}
        </div>

        {canManage && (
          <div className="pt-4 border-white/[0.06] border-t">
            <p className="mb-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
              Tindakan
            </p>
            <div className="flex flex-wrap gap-2">
              {v.status !== "revoked" && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Ban}
                  loading={saving}
                  onClick={() =>
                    change("revoked", {
                      title: "Batalkan pelanggaran?",
                      message:
                        "Status akan menjadi Dibatalkan dan poin tidak lagi dihitung. Riwayat tetap tersimpan, tidak ada data yang dihapus.",
                      confirmText: "Ya, batalkan",
                    })
                  }>
                  Batalkan
                </Button>
              )}
              {!["confirmed", "revoked"].includes(v.status) && (
                <Button
                  size="sm"
                  variant="dangerSoft"
                  icon={Flag}
                  loading={saving}
                  onClick={() =>
                    change("confirmed", {
                      title: "Konfirmasi pelanggaran?",
                      message:
                        "Pelanggaran akan ditandai Terbukti dan poin tetap berjalan.",
                      confirmText: "Ya, konfirmasi",
                      tone: "danger",
                    })
                  }>
                  Konfirmasi
                </Button>
              )}
              {!["under_review", "revoked"].includes(v.status) && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={saving}
                  onClick={() =>
                    change("under_review", {
                      title: "Set ke Ditinjau?",
                      message:
                        "Status pelanggaran akan diubah menjadi Ditinjau.",
                      confirmText: "Ya, lanjutkan",
                    })
                  }>
                  Set ke Ditinjau
                </Button>
              )}
              {["confirmed", "revoked"].includes(v.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  loading={saving}
                  onClick={() =>
                    change("active", {
                      title: "Aktifkan kembali?",
                      message:
                        "Pelanggaran akan kembali berstatus Aktif dan poin dihitung.",
                      confirmText: "Ya, aktifkan",
                    })
                  }>
                  Set ke Aktif
                </Button>
              )}
            </div>
          </div>
        )}

        {!canManage &&
          onClarify &&
          OPEN_VIOLATION_STATUSES.includes(v.status) && (
            <div className="pt-4 border-white/[0.06] border-t">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => onClarify(v)}>
                Ajukan Klarifikasi
              </Button>
            </div>
          )}
      </div>
    </Modal>
  );
}
