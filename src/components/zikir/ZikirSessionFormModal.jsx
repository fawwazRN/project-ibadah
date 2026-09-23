import { useEffect, useMemo, useState } from "react";
import { Save, Search, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input, Select, Textarea } from "../ui/Field";
import { Avatar } from "../ui/Avatar";
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

  // ----- Combobox pencarian imam -----
  const [leaderQuery, setLeaderQuery] = useState("");
  const [leaderOpen, setLeaderOpen] = useState(false);
  const selectedLeader = useMemo(
    () => santri.find((s) => s.id === form.leader_id) ?? null,
    [santri, form.leader_id],
  );
  const leaderSuggestions = useMemo(() => {
    const q = leaderQuery.trim().toLowerCase();
    if (!q) return santri.slice(0, 8);
    return santri
      .filter(
        (s) =>
          s.full_name.toLowerCase().includes(q) ||
          (s.class_name ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [santri, leaderQuery]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setLeaderOpen(false);
    profileService
      .listSantri()
      .then(setSantri)
      .catch(() => {});
    if (editing) {
      setForm({
        session_date: session.session_date,
        session_type: session.session_type,
        time_start: session.time_start?.slice(0, 5) ?? "16:30",
        location: session.location ?? "Masjid",
        leader_id: session.leader_id ?? "",
        note: session.note ?? "",
        repeat_weeks: 1,
      });
      setLeaderQuery(session.leader_name ?? "");
    } else {
      setForm({
        session_date: localToday(),
        session_type: "petang",
        time_start: "16:30",
        location: "Masjid",
        leader_id: "",
        note: "",
        repeat_weeks: 4,
      });
      setLeaderQuery("");
    }
  }, [open, session]);

  const pickLeader = (s) => {
    setForm((f) => ({ ...f, leader_id: s.id }));
    setLeaderQuery(s.full_name);
    setLeaderOpen(false);
  };
  const clearLeader = () => {
    setForm((f) => ({ ...f, leader_id: "" }));
    setLeaderQuery("");
    setLeaderOpen(false);
  };

  const submit = async () => {
    const errs = {};
    if (!form.session_date) errs.session_date = "Tanggal wajib diisi.";
    if (!form.time_start) errs.time_start = "Waktu wajib diisi.";
    if (form.leader_id && !selectedLeader)
      errs.leader = "Pilih imam dari daftar saran.";
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
          <Field label="Waktu (WIB)" required error={errors.time_start}>
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

        {/* Imam — combobox pencarian */}
        <Field
          label="Imam / Yang Memimpin"
          error={errors.leader}
          hint="Ketik nama atau kelas untuk mencari, lalu pilih dari saran.">
          <div className="relative">
            {selectedLeader ? (
              /* Terpilih: tampil sebagai chip */
              <div className="flex justify-between items-center gap-2 bg-brand/[0.06] px-3 py-2 border border-brand/30 rounded-lg">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={selectedLeader.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-100 text-sm truncate">
                      {selectedLeader.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedLeader.class_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearLeader}
                  aria-label="Hapus pilihan imam"
                  className="place-items-center grid hover:bg-white/10 rounded-md size-7 text-slate-400 hover:text-slate-200 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search
                    size={14}
                    className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
                  />
                  <Input
                    value={leaderQuery}
                    onChange={(e) => {
                      setLeaderQuery(e.target.value);
                      setLeaderOpen(true);
                    }}
                    onFocus={() => setLeaderOpen(true)}
                    placeholder="Ketik nama santri…"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
                {leaderOpen && leaderQuery !== "" && (
                  <div className="z-10 absolute bg-ink-800 shadow-card mt-1 border border-white/10 rounded-lg w-full max-h-52 overflow-y-auto">
                    {leaderSuggestions.length === 0 && (
                      <p className="px-3 py-2.5 text-slate-500 text-xs">
                        Tidak ada santri yang cocok.
                      </p>
                    )}
                    {leaderSuggestions.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => pickLeader(s)}
                        className="flex items-center gap-2.5 hover:bg-white/5 px-3 py-2 w-full text-left transition-colors">
                        <Avatar name={s.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm truncate">
                            {s.full_name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {s.class_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
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
