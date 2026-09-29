import { useState } from "react";
import { Plus } from "lucide-react";
import { Select } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { useToast } from "../../hooks/useToast";
import { lughahService } from "../../services/lughahService";

// Pemilih PEKAN ujian + tombol mulai pekan baru (per pekan: Jumat–Kamis)
export default function ExamSelector({ periods, value, onChange }) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const create = async () => {
    setSaving(true);
    try {
      const id = await lughahService.createPeriod(
        name.trim() || null,
        start || null,
      );
      push(
        "success",
        "Pekan baru dimulai",
        "Kelengkapan & nilai pekan ini mulai dari nol.",
      );
      setOpen(false);
      setName("");
      onChange(id);
    } catch (e) {
      push("error", "Gagal memulai pekan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-[260px]"
        options={(periods ?? []).map((p) => ({ value: p.id, label: p.name }))}
        placeholder="Pilih pekan…"
      />
      <Button
        variant="secondary"
        icon={Plus}
        size="sm"
        onClick={() => setOpen(true)}>
        Mulai Pekan Baru
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Mulai Pekan Baru"
        size="sm">
        <div className="space-y-4">
          <p className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl text-slate-500 text-xs leading-relaxed">
            Setiap pekan punya data kelengkapan &amp; nilai tersendiri
            (Jumat–Kamis). Pekan baru otomatis menjadi pekan aktif dan datanya
            mulai kosong.
          </p>
          <Field label="Tanggal Jumat mulai" required>
            <Input
              type="date"
              className="[color-scheme:dark]"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field
            label="Nama pekan (opsional)"
            hint="Kosongkan → otomatis: Pekan [tanggal]">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. Pekan Ujian Lisan"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" loading={saving} onClick={create}>
              Mulai Pekan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
