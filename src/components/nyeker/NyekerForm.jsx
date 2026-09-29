import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Check, Footprints } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { nyekerService } from "../../services/nyekerService";
import { profileService } from "../../services/profileService";

const localToday = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
const localNowTime = () => new Date().toTimeString().slice(0, 5);

export default function NyekerForm({ onSaved }) {
  const { push } = useToast();
  const [santri, setSantri] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(localToday());
  const [time, setTime] = useState(localNowTime());
  const [note, setNote] = useState("");
  const [fine, setFine] = useState(5000);
  const [saving, setSaving] = useState(false);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    setBooting(true);
    profileService
      .listSantri()
      .then(setSantri)
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  const filtered = useMemo(
    () =>
      santri
        .filter((s) => s.full_name.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8),
    [santri, q],
  );

  const submit = async () => {
    if (!selected) {
      push("error", "Pilih santri dulu", "Cari dan klik nama santri di atas.");
      return;
    }
    setSaving(true);
    try {
      await nyekerService.create({
        student_id: selected.id,
        nyeker_date: date,
        nyeker_time: time,
        note: note.trim() || null,
        fine_amount: Number(fine) || 5000,
      });
      push(
        "success",
        "Catatan nyeker berhasil ditambahkan",
        `${selected.full_name} · ${date} · denda Rp ${Number(fine).toLocaleString("id-ID")}`,
      );
      setSelected(null);
      setQ("");
      setNote("");
      setDate(localToday());
      setTime(localNowTime());
      setFine(5000);
      onSaved?.();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Catat Nyeker"
        description="Cari nama, klik, simpan — selesai dalam hitungan detik."
        actions={<Footprints size={15} className="text-brand-soft" />}
      />
      <div className="space-y-4 p-5">
        {/* Pencarian */}
        <Field label="Cari santri">
          <div className="relative">
            <Search
              size={14}
              className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ketik nama santri…"
              className="pl-9"
            />
          </div>
        </Field>

        {/* Hasil pencarian — klik utk memilih */}
        {!selected && q !== "" && (
          <div className="bg-ink-800 border border-white/10 rounded-lg max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2.5 text-slate-500 text-xs">
                Tidak ditemukan.
              </p>
            )}
            {filtered.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setSelected(s)}
                className="flex justify-between items-center hover:bg-white/5 px-3 py-2 w-full text-slate-300 text-sm text-left transition-colors">
                <span className="truncate">{s.full_name}</span>
                <span className="ml-2 text-slate-500 text-xs shrink-0">
                  {s.class_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Terpilih → form cepat */}
        {selected ? (
          <div className="space-y-4 bg-brand/[0.05] p-4 border border-brand/25 rounded-xl">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2.5">
                <span className="place-items-center grid bg-brand/10 border border-brand/30 rounded-lg size-8 text-brand-soft">
                  <Check size={15} />
                </span>
                <div>
                  <p className="font-semibold text-slate-100 text-sm">
                    {selected.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selected.class_name}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(null)}>
                Ganti
              </Button>
            </div>

            <div className="gap-3 grid grid-cols-2">
              <Field label="Tanggal">
                <Input
                  type="date"
                  value={date}
                  className="[color-scheme:dark]"
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label="Waktu">
                <Input
                  type="time"
                  value={time}
                  className="[color-scheme:dark]"
                  onChange={(e) => setTime(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Denda (Rp)" hint="Standar 5.000 — ubah bila perlu.">
              <Input
                type="number"
                min="0"
                max="1000000"
                value={fine}
                onChange={(e) => setFine(e.target.value)}
              />
            </Field>

            <Field label="Catatan (opsional)">
              <Textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Mis. Masjid, Koridor…"
              />
            </Field>

            <Button
              variant="primary"
              icon={Plus}
              loading={saving}
              onClick={submit}
              className="w-full">
              Catat Nyeker
            </Button>
          </div>
        ) : q === "" ? (
          <p className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl text-slate-500 text-xs italic">
            Ketik nama santri di atas untuk mulai mencatat.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
