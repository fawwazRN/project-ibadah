import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import { ruleService } from "../../services/ruleService";
import { RULE_CATEGORIES } from "../../lib/constants";

const SCOPE_LABELS = { ibadah: "Qism Ibadah", riyadhah: "Qism Riyadhah" };

export function RuleFormModal({
  open,
  onClose,
  rule,
  onSaved,
  scope = "ibadah",
}) {
  const editing = !!rule;
  const { profile } = useAuth();
  const isSuper = profile?.role === "super_admin";
  const { push } = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    points: 1,
    category: "Shalat",
    creates_suspension: false,
    suspension_weeks: 1,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Scope efektif: super admin bebas memilih; divisi terkunci ke modulnya
  const [scopeChoice, setScopeChoice] = useState(scope);
  const effScope = isSuper ? scopeChoice : scope;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setScopeChoice(editing ? (rule.scope ?? scope) : scope);
    setForm(
      editing
        ? {
            name: rule.name,
            description: rule.description ?? "",
            points: rule.points,
            category: rule.category,
            creates_suspension: rule.creates_suspension ?? false,
            suspension_weeks: rule.suspension_weeks ?? 1,
          }
        : {
            name: "",
            description: "",
            points: 1,
            category: "Shalat",
            creates_suspension: false,
            suspension_weeks: 1,
          },
    );
  }, [open, rule, scope]);

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
    if (
      form.creates_suspension &&
      (!Number.isInteger(+form.suspension_weeks) ||
        +form.suspension_weeks < 1 ||
        +form.suspension_weeks > 52)
    )
      errs.suspension_weeks = "Durasi harus bilangan 1–52 pekan.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        points: +form.points,
        scope: effScope,
        suspension_weeks: form.creates_suspension ? +form.suspension_weeks : 1,
      };
      if (editing) {
        await ruleService.update(rule.id, payload);
        push("success", "Aturan diperbarui", form.name);
      } else {
        await ruleService.create(payload);
        push(
          "success",
          "Aturan dibuat",
          `${form.name} · ${SCOPE_LABELS[effScope]}`,
        );
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
        {/* Ranah modul */}
        {isSuper ? (
          <Field
            label="Ranah Modul"
            required
            hint="Menentukan divisi mana yang boleh mencatat pelanggaran aturan ini.">
            <Select
              value={scopeChoice}
              onChange={(e) => setScopeChoice(e.target.value)}
              options={[
                { value: "ibadah", label: "Qism Ibadah" },
                { value: "riyadhah", label: "Qism Riyadhah" },
              ]}
            />
          </Field>
        ) : (
          <p className="bg-white/[0.03] px-3 py-2 border border-white/10 rounded-lg text-slate-400 text-xs">
            Aturan ini milik{" "}
            <span className="font-semibold text-slate-200">
              {SCOPE_LABELS[scope]}
            </span>{" "}
            — hanya divisi ini yang dapat mencatat pelanggaran dengannya.
          </p>
        )}

        <Field label="Nama aturan" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Mis. Tidak masuk halaqah"
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

        <Field
          label="Menimbulkan suspensi Riyadhah?"
          hint="Bila aktif, pelanggaran berstatus Terbukti otomatis membuat pemain tidak bisa bermain.">
          <label className="flex items-center gap-2.5 bg-white/[0.03] px-3 py-2.5 border border-white/10 rounded-lg text-slate-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.creates_suspension}
              onChange={(e) =>
                setForm((f) => ({ ...f, creates_suspension: e.target.checked }))
              }
              className="size-4 accent-emerald-500"
            />
            Ya, aturan ini membuat pemain ter-suspensi
          </label>
        </Field>

        {form.creates_suspension && (
          <Field
            label="Durasi suspensi (pekan)"
            required
            error={errors.suspension_weeks}>
            <Input
              type="number"
              min="1"
              max="52"
              value={form.suspension_weeks}
              onChange={(e) =>
                setForm((f) => ({ ...f, suspension_weeks: e.target.value }))
              }
            />
          </Field>
        )}

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
