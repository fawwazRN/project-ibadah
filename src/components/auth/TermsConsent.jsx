import { useState } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

// Syarat & ketentuan akses — wajib disetujui sebelum Daftar / Masuk / Lihat sebagai tamu.
export const TERMS = [
  {
    icon: ShieldCheck,
    title: "Jangan dibuka saat pelajaran IT",
    text: "Aplikasi ini tidak boleh dibuka selama pelajaran IT sedang berlangsung.",
  },
  {
    icon: Clock,
    title: "Hanya di waktu kosong / free time IT",
    text: "Aplikasi hanya boleh dibuka ketika jam IT kosong atau saat free time.",
  },
];

export default function TermsConsent({ agreed, onChange, error }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <label
        className={`flex items-start gap-3 rounded-2xl border-2 p-3 cursor-pointer transition-colors ${
          error ? "border-rose-300 bg-rose-50" : "border-line bg-card"
        }`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-5 accent-[var(--color-brand)] shrink-0"
        />
        <span className="font-semibold text-[13px] text-fg-2 leading-snug">
          Saya sudah membaca dan setuju dengan{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className="font-extrabold text-brand-dim underline underline-offset-2">
            Syarat &amp; Ketentuan
          </button>{" "}
          penggunaan.
        </span>
      </label>
      {error && (
        <p className="px-1 font-bold text-rose-700 text-xs">
          Centang persetujuan dulu untuk melanjutkan.
        </p>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Syarat & Ketentuan" size="sm">
        <p className="mb-4 font-semibold text-fg-3 text-sm leading-relaxed">
          Sebelum masuk (daftar, masuk, atau lihat sebagai tamu), santri wajib
          mematuhi ketentuan berikut:
        </p>
        <ol className="space-y-3">
          {TERMS.map((t, i) => (
            <li key={t.title} className="flex gap-3 bg-soft p-3.5 border-2 border-line rounded-2xl">
              <span className="place-items-center grid bg-brand rounded-xl size-9 font-black text-on-brand shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-extrabold text-fg text-sm">{t.title}</p>
                <p className="mt-0.5 font-semibold text-fg-3 text-xs leading-relaxed">{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="flex gap-2 mt-5">
          <Button className="flex-1" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              onChange(true);
              setOpen(false);
            }}>
            Saya setuju
          </Button>
        </div>
      </Modal>
    </div>
  );
}
