import { useState } from "react";
import { Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Field";
import {
  ReportStatusBadge,
  ViolationStatusBadge,
} from "../violations/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { reportService } from "../../services/reportService";

export function ReportReviewModal({ report, open, onClose, onChanged }) {
  const { push } = useToast();
  const confirm = useConfirm();
  const [note, setNote] = useState(report?.review_note ?? "");
  const [saving, setSaving] = useState(false);

  if (!report) return null;
  const v = report.violation;
  const openDecision = ["pending", "reviewing"].includes(report.status);

  const act = async (decision, opts) => {
    if (!(await confirm(opts))) return;
    setSaving(true);
    try {
      await reportService.review({
        id: report.id,
        decision,
        review_note: note,
      });
      push(
        "success",
        decision === "accepted"
          ? "Laporan diterima"
          : decision === "rejected"
            ? "Laporan ditolak"
            : "Laporan ditandai ditinjau",
        decision === "accepted"
          ? "Pelanggaran terkait dibatalkan."
          : decision === "rejected"
            ? "Pelanggaran dikonfirmasi."
            : "",
      );
      onChanged?.();
      onClose();
    } catch (e) {
      push("error", "Gagal memproses laporan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tinjau Laporan Santri"
      size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <p className="font-display font-semibold text-slate-100 text-base">
              {v?.santri?.full_name}
            </p>
            <p className="text-slate-500 text-xs">
              Kelas {v?.santri?.class_name} · diajukan{" "}
              {new Date(report.created_at).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReportStatusBadge status={report.status} />
            <ViolationStatusBadge status={v?.status} />
          </div>
        </div>

        <div className="gap-3 grid sm:grid-cols-2">
          <div className="bg-white/[0.02] p-3.5 border border-white/[0.06] rounded-xl">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">
              Pelanggaran asal
            </p>
            <div className="flex justify-between items-center gap-2 mt-1.5">
              <p className="font-medium text-slate-200 text-sm">
                {v?.rule?.name}
              </p>
              <Badge tone="rose">+{v?.rule?.points} poin</Badge>
            </div>
            <p className="mt-1 text-slate-500 text-xs">
              Kejadian {new Date(v?.occurred_at).toLocaleString("id-ID")}
            </p>
            {v?.note && (
              <p className="mt-2 text-slate-500 text-xs italic">“{v.note}”</p>
            )}
          </div>
          <div className="bg-white/[0.02] p-3.5 border border-white/[0.06] rounded-xl">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider">
              Alasan santri
            </p>
            <p className="mt-1.5 font-medium text-slate-200 text-sm">
              {report.reason}
            </p>
            <p className="mt-2 pl-3 border-brand/40 border-l-2 text-slate-400 text-sm leading-relaxed">
              {report.explanation}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[11px] text-slate-500 uppercase tracking-wider">
            Catatan tinjauan
          </p>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              report.status === "pending"
                ? "Tulis hasil verifikasi…"
                : "Catatan reviewer…"
            }
          />
        </div>

        {openDecision ? (
          <div className="flex flex-wrap justify-end gap-2 pt-4 border-white/[0.06] border-t">
            {report.status === "pending" && (
              <Button
                variant="secondary"
                icon={Eye}
                loading={saving}
                onClick={() =>
                  act("reviewing", {
                    title: "Tandai sedang ditinjau?",
                    message: "Laporan akan berstatus Ditinjau.",
                    confirmText: "Ya, tandai",
                  })
                }>
                Mulai Tinjau
              </Button>
            )}
            <Button
              variant="dangerSoft"
              icon={ThumbsDown}
              loading={saving}
              onClick={() =>
                act("rejected", {
                  title: "Tolak laporan ini?",
                  message:
                    "Pelanggaran akan berstatus Terbukti dan poin tetap berjalan. Santri akan melihat catatan tinjauanmu.",
                  confirmText: "Ya, tolak",
                  tone: "danger",
                })
              }>
              Tolak
            </Button>
            <Button
              variant="primary"
              icon={ThumbsUp}
              loading={saving}
              onClick={() =>
                act("accepted", {
                  title: "Terima laporan ini?",
                  message:
                    "Pelanggaran akan dibatalkan (revoked) dan poin santri dikembalikan. Riwayat tetap tersimpan.",
                  confirmText: "Ya, terima",
                })
              }>
              Terima &amp; Batalkan Poin
            </Button>
          </div>
        ) : (
          <p className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl text-slate-400 text-sm">
            <span className="font-medium text-slate-300">Keputusan: </span>
            {report.status === "accepted"
              ? "Diterima — poin dibatalkan."
              : "Ditolak — pelanggaran dikonfirmasi."}
            {report.reviewer?.full_name && (
              <>
                {" "}
                · oleh {report.reviewer.full_name} ·{" "}
                {new Date(report.reviewed_at).toLocaleString("id-ID")}
              </>
            )}
          </p>
        )}
      </div>
    </Modal>
  );
}
