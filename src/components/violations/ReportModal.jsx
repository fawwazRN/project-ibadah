import { useState } from "react";
import { Send } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Field, Select, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { reportService } from "../../services/reportService";
import { REPORT_REASONS } from "../../lib/constants";

export function ReportModal({ open, onClose, violation, onSubmitted }) {
  const { push } = useToast();
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const errs = {};
    if (!reason) errs.reason = "Pilih alasan klarifikasi.";
    if (explanation.trim().length < 15)
      errs.explanation = "Jelaskan minimal 15 karakter agar dapat ditinjau.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await reportService.create({
        violation_id: violation.id,
        reason,
        explanation,
      });
      push(
        "success",
        "Klarifikasi diajukan",
        "Laporan kamu akan ditinjau oleh OSIS Qism Ibadah.",
      );
      onSubmitted?.();
      onClose();
      setReason("");
      setExplanation("");
    } catch (e) {
      push("error", "Gagal mengirim laporan", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!violation) return null;
  return (
    <Modal open={open} onClose={onClose} title="Ajukan Klarifikasi">
      <div className="space-y-4">
        <div className="bg-white/[0.03] p-3.5 border border-white/[0.07] rounded-xl">
          <div className="flex justify-between items-center gap-2">
            <p className="font-medium text-slate-200 text-sm">
              {violation.rule?.name}
            </p>
            <Badge tone="rose">+{violation.rule?.points} poin</Badge>
          </div>
          <p className="mt-1 text-slate-500 text-xs">
            Tercatat {new Date(violation.occurred_at).toLocaleString("id-ID")}
          </p>
        </div>

        <Field label="Alasan" required error={errors.reason}>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Pilih alasan…"
            options={REPORT_REASONS.map((r) => ({ value: r, label: r }))}
          />
        </Field>

        <Field
          label="Penjelasan"
          required
          error={errors.explanation}
          hint="Contoh: “Saya sebenarnya memakai peci ketika shalat Maghrib.”">
          <Textarea
            rows={4}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Tulis penjelasanmu…"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon={Send}
            loading={saving}
            onClick={submit}>
            Kirim Laporan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
