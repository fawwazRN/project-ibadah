import { useEffect, useState } from "react";
import { UserPlus, X, CheckCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { violationService } from "../../services/violationService";
import { profileService } from "../../services/profileService";
import { ruleService } from "../../services/ruleService";
import {
  PRAYER_TIMES,
  PRAYER_LABELS,
  PRAYER_CLOCK,
  detectPrayer,
} from "../../lib/constants";

const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const localNowTime = () => new Date().toTimeString().slice(0, 5);

// Satu-satunya komponen di file ini. scope menentukan:
// - aturan apa saja yang tampil (filter scope)
// - input waktu: ibadah = waktu shalat · riyadhah = jam
export function ViolationFormModal({
  open,
  onClose,
  onSaved,
  scope = "ibadah",
}) {
  const isIbadah = scope === "ibadah";
  const { push } = useToast();
  const [santri, setSantri] = useState([]);
  const [rules, setRules] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    rule_id: "",
    session_date: localToday(),
    prayer_time: "",
    violation_time: localNowTime(),
    note: "",
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBooting(true);
    setSelectedIds([]);
    setForm({
      rule_id: "",
      session_date: localToday(),
      prayer_time: "",
      violation_time: localNowTime(),
      note: "",
    });
    setQuery("");
    setErrors({});
    Promise.all([
      profileService.listSantri(),
      ruleService.list({ activeOnly: true, scope }),
    ])
      .then(([s, r]) => {
        setSantri(s);
        setRules(r);
      })
      .catch((e) => push("error", "Gagal memuat data form", e.message))
      .finally(() => setBooting(false));
  }, [open, scope]);

  const rule = rules.find((r) => r.id === form.rule_id);
  const selectedSantri = selectedIds
    .map((id) => santri.find((s) => s.id === id))
    .filter(Boolean);
  const q = query.trim().toLowerCase();
  const filtered = santri.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q) ||
      (s.class_name ?? "").toLowerCase().includes(q),
  );
  const classes = [...new Set(santri.map((s) => s.class_name).filter(Boolean))];

  const toggle = (id) =>
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  const addMany = (list) =>
    setSelectedIds((ids) => [...new Set([...ids, ...list.map((s) => s.id)])]);

  const submit = async () => {
    const errs = {};
    if (!selectedIds.length) errs.santri = "Pilih minimal satu santri.";
    if (!form.rule_id) errs.rule = "Pilih aturan yang dilanggar.";
    if (!form.session_date) errs.session_date = "Tanggal wajib diisi.";
    if (!isIbadah && !form.violation_time)
      errs.violation_time = "Waktu (jam) wajib diisi.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      // Ibadah → jam mengikuti acuan waktu shalat · Riyadhah → jam yang diinput
      const clock = isIbadah
        ? form.prayer_time
          ? PRAYER_CLOCK[form.prayer_time]
          : localNowTime()
        : form.violation_time;
      const occurredAt = `${form.session_date}T${clock}:00+07:00`;

      const created = await violationService.createMany({
        santri_ids: selectedIds,
        rule_id: form.rule_id,
        occurred_at: occurredAt,
        prayer_time: isIbadah ? form.prayer_time || null : null,
        note: form.note,
      });
      push(
        "success",
        `${created.length} pelanggaran tercatat`,
        created.length === 1
          ? `${rule.name} — ${selectedSantri[0]?.full_name ?? ""}`
          : `${rule.name} — ${created.length} santri`,
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
          <Field
            label={`Santri${selectedIds.length ? ` (${selectedIds.length} dipilih)` : ""}`}
            required
            error={errors.santri}
            hint="Bisa pilih banyak santri sekaligus — pelanggaran & waktunya sama.">
            {selectedSantri.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedSantri.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className="inline-flex items-center gap-1 bg-brand/15 px-2 py-1 border border-brand/30 hover:border-rose-400/50 rounded-full text-brand-soft text-xs transition-colors">
                    {s.full_name}
                    <X size={11} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 text-slate-500 hover:text-rose-300 text-xs">
                  Kosongkan
                </button>
              </div>
            )}
            <Input
              placeholder="Cari nama atau kelas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {classes.length > 0 && query === "" && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500">
                  Pilih satu kelas:
                </span>
                {classes.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() =>
                      addMany(santri.filter((s) => s.class_name === c))
                    }
                    className="bg-violet-400/10 hover:bg-violet-400/20 px-2 py-0.5 border border-violet-400/25 rounded-md text-[11px] text-violet-300 transition-colors">
                    {c}
                  </button>
                ))}
              </div>
            )}
            {query !== "" && (
              <div className="bg-ink-800 mt-1 border border-white/10 rounded-lg max-h-52 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2.5 text-slate-500 text-xs">
                    Tidak ditemukan.
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => addMany(filtered)}
                      className="flex items-center gap-1.5 hover:bg-white/5 px-3 py-2 border-white/10 border-b w-full text-brand-soft text-xs text-left">
                      <CheckCheck size={13} /> Pilih semua hasil (
                      {filtered.length})
                    </button>
                    {filtered.slice(0, 30).map((s) => {
                      const on = selectedIds.includes(s.id);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggle(s.id)}
                          className={`flex justify-between items-center hover:bg-white/5 px-3 py-2 w-full text-sm text-left transition-colors ${on ? "bg-brand/10 text-brand-soft" : "text-slate-300"}`}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`grid size-4 place-items-center rounded border text-[10px] ${on ? "border-brand bg-brand text-ink-950" : "border-white/20"}`}>
                              {on && "✓"}
                            </span>
                            {s.full_name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {s.class_name}
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            )}
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
            <p className="flex flex-wrap items-center gap-2 -mt-2 text-slate-400 text-xs">
              Poin otomatis: <Badge tone="rose">+{rule.points} poin</Badge>
              {rule.creates_suspension && (
                <Badge tone="violet">
                  Suspensi {rule.suspension_weeks} pekan
                </Badge>
              )}
            </p>
          )}

          <div className="gap-3 grid grid-cols-2">
            <Field label="Tanggal" required error={errors.session_date}>
              <Input
                type="date"
                value={form.session_date}
                className="[color-scheme:dark]"
                onChange={(e) =>
                  setForm((f) => ({ ...f, session_date: e.target.value }))
                }
              />
            </Field>

            {isIbadah ? (
              <Field
                label="Waktu Shalat (opsional)"
                hint="Ketik di catatan (mis. “isya”) → terpilih otomatis.">
                <Select
                  value={form.prayer_time}
                  placeholder="— tanpa waktu shalat —"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, prayer_time: e.target.value }))
                  }
                  options={PRAYER_TIMES.map((p) => ({
                    value: p,
                    label: PRAYER_LABELS[p],
                  }))}
                />
              </Field>
            ) : (
              <Field label="Waktu (jam)" required error={errors.violation_time}>
                <Input
                  type="time"
                  value={form.violation_time}
                  className="[color-scheme:dark]"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, violation_time: e.target.value }))
                  }
                />
              </Field>
            )}
          </div>

          <Field label="Catatan (opsional)">
            <Textarea
              value={form.note}
              onChange={(e) => {
                const note = e.target.value;
                setForm((f) =>
                  isIbadah
                    ? {
                        ...f,
                        note,
                        prayer_time: detectPrayer(note) ?? f.prayer_time,
                      }
                    : { ...f, note },
                );
              }}
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
              {selectedIds.length > 1
                ? `Simpan untuk ${selectedIds.length} santri`
                : "Simpan Pelanggaran"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
