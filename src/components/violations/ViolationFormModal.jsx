import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
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
    santri_id: "",
    rule_id: "",
    session_date: localToday(),
    prayer_time: "",
    violation_time: localNowTime(),
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBooting(true);
    setForm({
      santri_id: "",
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
    if (!form.session_date) errs.session_date = "Tanggal wajib diisi.";
    if (!isIbadah && !form.violation_time)
      errs.violation_time = "Waktu (jam) wajib diisi.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      // Ibadah → jam mengikuti acuan waktu shalat · Riyadhah → jam yang diinput petugas
      const clock = isIbadah
        ? form.prayer_time
          ? PRAYER_CLOCK[form.prayer_time]
          : localNowTime()
        : form.violation_time;
      const occurredAt = `${form.session_date}T${clock}:00+07:00`;

      await violationService.create({
        santri_id: form.santri_id,
        rule_id: form.rule_id,
        occurred_at: occurredAt,
        prayer_time: isIbadah ? form.prayer_time || null : null, // Riyadhah tanpa waktu shalat
        note: form.note,
        santri_name: selected.full_name,
        rule_name: rule.name,
        rule_points: rule.points,
      });
      push(
        "success",
        "Pelanggaran tercatat",
        `${rule.name} — ${selected.full_name}`,
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
              /* IBADAH: waktu shalat */
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
              /* RIYADHAH: jam */
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
                // Deteksi otomatis waktu shalat hanya untuk modul Ibadah
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
              Simpan Pelanggaran
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
