import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { useToast } from "../../hooks/useToast";

// Modal input/edit nilai — validasi 0–100
export default function ScoreInput({
  open,
  onClose,
  student,
  current,
  onSave,
}) {
  const { push } = useToast();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(current ?? "");
  }, [open, current]);

  const submit = async () => {
    if (value === "") return push("error", "Nilai belum diisi");
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      return push(
        "error",
        "Nilai tidak valid",
        "Gunakan bilangan bulat 0–100.",
      );
    }
    setSaving(true);
    try {
      await onSave(n);
      push("success", "Nilai berhasil disimpan", `${student.full_name} · ${n}`);
      onClose();
    } catch (e) {
      push("error", "Gagal menyimpan nilai", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Input Nilai" size="sm">
      {student && (
        <div className="space-y-4">
          <div className="bg-white/[0.02] p-3.5 border border-white/[0.06] rounded-xl">
            <p className="font-semibold text-slate-100 text-sm">
              {student.full_name}
            </p>
            <p className="text-slate-500 text-xs">{student.class_name}</p>
          </div>
          <Field label="Nilai" required hint="Rentang 0–100.">
            <Input
              type="number"
              min="0"
              max="100"
              value={value}
              autoFocus
              onChange={(e) => setValue(e.target.value)}
              placeholder="Mis. 92"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="primary"
              icon={Save}
              loading={saving}
              onClick={submit}>
              Simpan Nilai
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
