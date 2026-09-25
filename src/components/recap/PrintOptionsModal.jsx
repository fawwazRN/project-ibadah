import { useEffect, useState } from "react";
import { Printer, FileText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useToast } from "../../hooks/useToast";

// Konfigurasi bagian per modul — label + key yang dibaca dokumen cetak
export const IBADAH_SECTIONS = [
  { key: "summary", label: "Ringkasan (angka umum)", locked: false },
  { key: "perSantri", label: "Rekap per Santri (total poin)", locked: false },
  { key: "perClass", label: "Rekap per Kelas", locked: false },
  { key: "perRule", label: "Rekap per Aturan", locked: false },
  { key: "detail", label: "Detail Pelanggaran (tabel lengkap)", locked: false },
  { key: "reports", label: "Klarifikasi Santri", locked: false },
  { key: "signatures", label: "Blok Tanda Tangan", locked: false },
];

export const RIYADHAH_SECTIONS = [
  { key: "schedule", label: "Jadwal Pertandingan Pekan Ini", locked: false },
  { key: "standings", label: "Klasemen Sementara", locked: false },
  { key: "scorers", label: "Pencetak Gol Terbanyak", locked: false },
  {
    key: "sanctions",
    label: "Sanksi Liga (Pemain Ter-suspensi)",
    locked: false,
  },
  { key: "perClass", label: "Rekap per Kelas", locked: false },
  { key: "signatures", label: "Blok Tanda Tangan", locked: false },
];

const STORAGE_KEY = "osis.printOptions";

export function loadPrintOptions(module) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return all[module] ?? null;
  } catch {
    return null;
  }
}

export function savePrintOptions(module, opts) {
  const all = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      return {};
    }
  })();
  all[module] = opts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export default function PrintOptionsModal({
  open,
  onClose,
  module,
  sections,
  defaultSelected,
  onPrint,
}) {
  const { push } = useToast();
  const saved = loadPrintOptions(module);
  const initial =
    saved ?? Object.fromEntries(sections.map((s) => [s.key, true]));

  const [selected, setSelected] = useState(initial);

  useEffect(() => {
    if (open) {
      const s = loadPrintOptions(module);
      setSelected(s ?? Object.fromEntries(sections.map((x) => [x.key, true])));
    }
  }, [open, module, sections]);

  const toggle = (key) => setSelected((s) => ({ ...s, [key]: !s[key] }));
  const setAll = (v) =>
    setSelected(Object.fromEntries(sections.map((s) => [s.key, v])));

  const print = () => {
    const chosen = sections.filter((s) => selected[s.key]).map((s) => s.key);
    if (chosen.length === 0) {
      push(
        "error",
        "Belum ada bagian dipilih",
        "Centang minimal satu bagian untuk dicetak.",
      );
      return;
    }
    savePrintOptions(module, selected);
    onPrint(chosen);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Atur Isi Laporan" size="sm">
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-slate-500 text-xs leading-relaxed">
          <FileText size={13} className="mt-0.5 text-slate-600 shrink-0" />
          Pilih bagian yang ingin dicetak. Pilihan kamu diingat untuk cetakan
          berikutnya.
        </p>

        <div className="space-y-1.5">
          {sections.map((s) => (
            <label
              key={s.key}
              className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.05] px-3 py-2.5 border border-white/10 rounded-lg text-slate-300 text-sm transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={!!selected[s.key]}
                onChange={() => toggle(s.key)}
                className="size-4 accent-emerald-500"
              />
              {s.label}
            </label>
          ))}
        </div>

        <div className="flex justify-between items-center text-xs">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="text-brand-soft hover:underline">
            Pilih semua
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="text-slate-500 hover:underline">
            Kosongkan
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-white/[0.06] border-t">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" icon={Printer} onClick={print}>
            Cetak Sekarang
          </Button>
        </div>
      </div>
    </Modal>
  );
}
