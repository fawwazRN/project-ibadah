import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { ruleService } from "../../services/ruleService";
import { RULE_CATEGORIES } from "../../lib/constants";

export function RuleFormModal({ open, onClose, rule, onSaved }) {
  const { push } = useToast();
  const editing = !!rule;
  const [form, setForm] = useState({
    name: "",
    description: "",
    points: 1,
    category: "Shalat",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      editing
        ? {
            name: rule.name,
            description: rule.description ?? "",
            points: rule.points,
            category: rule.category,
          }
        : { name: "", description: "", points: 1, category: "Shalat" },
    );
  }, [open, rule]);

  const submit = async () => {
    const errs = {};
    if (form.name.trim().length < 3)
      errs.name = "Nama aturan minimal 3 karakter.";
    if (
      !Number.isInteger(+form.points) ||
      +form.points < 0 ||
      +form.points > 100
    )
      errs.points = "Poin harus bilangan 0–100.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = { ...form, points: +form.points };
      if (editing) {
        await ruleService.update(rule.id, payload);
        push("success", "Aturan diperbarui", form.name);
      } else {
        await ruleService.create(payload);
        push("success", "Aturan dibuat", form.name);
      }
      onSaved?.();
      onClose();
    } catch (e) {
      push("error", "Gagal menyimpan aturan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Aturan" : "Tambah Aturan"}>
      <div className="space-y-4">
        <Field label="Nama aturan" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Mis. Tidak mengikuti tadarus pagi"
          />
        </Field>
        <Field label="Deskripsi">
          <Textarea
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Jelaskan ketentuan aturan…"
          />
        </Field>
        <div className="gap-3 grid grid-cols-2">
          <Field label="Poin" required error={errors.points}>
            <Input
              type="number"
              min="0"
              max="100"
              value={form.points}
              onChange={(e) =>
                setForm((f) => ({ ...f, points: e.target.value }))
              }
            />
          </Field>
          <Field label="Kategori" required>
            <Select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              options={RULE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {editing ? "Simpan Perubahan" : "Tambah Aturan"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
