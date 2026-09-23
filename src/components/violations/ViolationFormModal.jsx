import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Field, Input, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { violationService } from "../../services/violationService";
import { profileService } from "../../services/profileService";
import { ruleService } from "../../services/ruleService";

const localNow = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export function ViolationFormModal({ open, onClose, onSaved }) {
  const { push } = useToast();
  const [santri, setSantri] = useState([]);
  const [rules, setRules] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    santri_id: "",
    rule_id: "",
    occurred_at: localNow(),
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBooting(true);
    setForm({ santri_id: "", rule_id: "", occurred_at: localNow(), note: "" });
    setQuery("");
    setErrors({});
    Promise.all([
      profileService.listSantri(),
      ruleService.list({ activeOnly: true }),
    ])
      .then(([s, r]) => {
        setSantri(s);
        setRules(r);
      })
      .catch((e) => push("error", "Gagal memuat data form", e.message))
      .finally(() => setBooting(false));
  }, [open]);

  const rule = rules.find((r) => r.id === form.rule_id);
  const selected = santri.find((s) => s.id === form.santri_id);
  const filtered = santri.filter(
    (s) =>
      s.full_name.toLowerCase().includes(query.toLowerCase()) ||
      (s.class_name ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const submit = async () => {
    const errs = {};
    if (!form.santri_id) errs.santri = "Pilih santri terlebih dahulu.";
    if (!form.rule_id) errs.rule = "Pilih aturan yang dilanggar.";
    if (!form.occurred_at) errs.occurred_at = "Waktu wajib diisi.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await violationService.create({
        ...form,
        santri_name: selected.full_name,
        rule_name: rule.name,
        rule_points: rule.points,
      });
      push(
        "success",
        "Pelanggaran tercatat",
        `${rule.name} · ${rule.points} poin — ${selected.full_name}`,
      );
      onSaved?.();
      onClose();
    } catch (e) {
      push("error", "Gagal menyimpan pelanggaran", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Catat Pelanggaran" size="md">
      {booting ? (
        <p className="py-6 text-slate-500 text-sm text-center">Memuat…</p>
      ) : (
        <div className="space-y-4">
          <Field label="Santri" required error={errors.santri}>
            <div className="relative">
              <Input
                placeholder={
                  selected ? selected.full_name : "Cari nama atau kelas…"
                }
                value={selected ? selected.full_name : query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setForm((f) => ({ ...f, santri_id: "" }));
                }}
              />
              {!selected && query !== "" && (
                <div className="z-10 absolute bg-ink-800 shadow-card mt-1 border border-white/10 rounded-lg w-full max-h-44 overflow-y-auto">
                  {filtered.length === 0 && (
                    <p className="px-3 py-2.5 text-slate-500 text-xs">
                      Tidak ditemukan.
                    </p>
                  )}
                  {filtered.slice(0, 8).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setForm((f) => ({ ...f, santri_id: s.id }));
                        setQuery("");
                      }}
                      className="flex justify-between items-center hover:bg-white/5 px-3 py-2 w-full text-slate-300 text-sm text-left transition-colors">
                      <span>{s.full_name}</span>
                      <span className="text-slate-500 text-xs">
                        {s.class_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field label="Aturan yang dilanggar" required error={errors.rule}>
            <select
              value={form.rule_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, rule_id: e.target.value }))
              }
              className="appearance-none field">
              <option value="">Pilih aturan…</option>
              {rules.map((r) => (
                <option key={r.id} value={r.id} className="bg-ink-800">
                  {r.name} (+{r.points} poin)
                </option>
              ))}
            </select>
          </Field>
          {rule && (
            <p className="flex items-center gap-2 -mt-2 text-slate-400 text-xs">
              Poin otomatis dari aturan:{" "}
              <Badge tone="rose">+{rule.points} poin</Badge>
              <span className="text-slate-600">· kategori {rule.category}</span>
            </p>
          )}

          <Field label="Waktu kejadian" required error={errors.occurred_at}>
            <Input
              type="datetime-local"
              value={form.occurred_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, occurred_at: e.target.value }))
              }
              className="[color-scheme:dark]"
            />
          </Field>

          <Field
            label="Catatan (opsional)"
            hint="Mis. lokasi, kegiatan, atau keterangan petugas.">
            <Textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Catatan tambahan…"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="primary"
              icon={UserPlus}
              loading={saving}
              onClick={submit}>
              Simpan Pelanggaran
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
