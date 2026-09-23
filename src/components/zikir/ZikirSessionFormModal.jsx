import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { zikirService } from "../../services/zikirService";
import { profileService } from "../../services/profileService";

const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export function ZikirSessionFormModal({ open, onClose, onSaved, session }) {
  const editing = !!session;
  const { push } = useToast();
  const [santri, setSantri] = useState([]);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    profileService
      .listSantri()
      .then(setSantri)
      .catch(() => {});
    setForm(
      editing
        ? {
            session_date: session.session_date,
            session_type: session.session_type,
            time_start: session.time_start?.slice(0, 5) ?? "16:30",
            location: session.location ?? "Masjid",
            leader_id: session.leader_id ?? "",
            note: session.note ?? "",
            repeat_weeks: 1,
          }
        : {
            session_date: localToday(),
            session_type: "petang",
            time_start: "16:30",
            location: "Masjid",
            leader_id: "",
            note: "",
            repeat_weeks: 4,
          },
    );
  }, [open, session]);

  const submit = async () => {
    const errs = {};
    if (!form.session_date) errs.session_date = "Tanggal wajib diisi.";
    if (!form.time_start) errs.time_start = "Waktu wajib diisi.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (editing) {
        await zikirService.update(session.id, {
          session_date: form.session_date,
          session_type: form.session_type,
          time_start: form.time_start,
          location: form.location || null,
          leader_id: form.leader_id || null,
          note: form.note || null,
        });
        push("success", "Jadwal diperbarui");
      } else {
        await zikirService.create(form);
        push(
          "success",
          "Jadwal zikir dibuat",
          Number(form.repeat_weeks) > 1
            ? `Dibuat untuk ${form.repeat_weeks} pekan ke depan.`
            : "",
        );
      }
      onSaved?.();
      onClose();
    } catch (e) {
      push("error", "Gagal menyimpan jadwal", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Jadwal Zikir" : "Tambah Jadwal Zikir"}>
      <div className="space-y-4">
        <div className="gap-3 grid grid-cols-2">
          <Field label="Tanggal" required error={errors.session_date}>
            <Input
              type="date"
              value={form.session_date ?? ""}
              className="[color-scheme:dark]"
              onChange={(e) =>
                setForm((f) => ({ ...f, session_date: e.target.value }))
              }
            />
          </Field>
          <Field label="Sesi" required>
            <Select
              value={form.session_type ?? "petang"}
              onChange={(e) =>
                setForm((f) => ({ ...f, session_type: e.target.value }))
              }
              options={[
                { value: "pagi", label: "Zikir Pagi" },
                { value: "petang", label: "Zikir Petang" },
              ]}
            />
          </Field>
        </div>

        <div className="gap-3 grid grid-cols-2">
          <Field label="Waktu" required error={errors.time_start}>
            <Input
              type="time"
              value={form.time_start ?? ""}
              className="[color-scheme:dark]"
              onChange={(e) =>
                setForm((f) => ({ ...f, time_start: e.target.value }))
              }
            />
          </Field>
          <Field label="Lokasi">
            <Input
              value={form.location ?? ""}
              placeholder="Masjid"
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </Field>
        </div>

        <Field
          label="Imam / Yang Memimpin"
          required={!editing}
          hint={
            editing
              ? "Ubah di sini bila rotasi imam berubah."
              : "Bisa juga ditentukan belakangan lewat Edit."
          }>
          <Select
            value={form.leader_id ?? ""}
            placeholder="Pilih santri…"
            onChange={(e) =>
              setForm((f) => ({ ...f, leader_id: e.target.value }))
            }
            options={santri.map((s) => ({
              value: s.id,
              label: `${s.full_name} — ${s.class_name}`,
            }))}
          />
        </Field>

        <Field label="Catatan (opsional)">
          <Textarea
            rows={2}
            value={form.note ?? ""}
            placeholder="Mis. tema zikir, keterangan khusus…"
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </Field>

        {!editing && (
          <Field
            label="Ulangi setiap pekan"
            hint="Jadwal yang sama dibuat otomatis tiap pekan pada hari yang sama. Yang sudah ada dilewati.">
            <Select
              value={String(form.repeat_weeks ?? 1)}
              onChange={(e) =>
                setForm((f) => ({ ...f, repeat_weeks: e.target.value }))
              }
              options={[1, 2, 4, 6, 8, 12].map((n) => ({
                value: String(n),
                label: `${n} pekan ke depan`,
              }))}
            />
          </Field>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={submit}>
            {editing ? "Simpan Perubahan" : "Buat Jadwal"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
