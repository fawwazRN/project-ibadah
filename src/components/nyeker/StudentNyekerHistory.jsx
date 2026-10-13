import { Footprints } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Avatar } from "../ui/Avatar";
import { EmptyState } from "../ui/States";
import { fmtDate } from "../../lib/date";

// Riwayat nyeker satu santri — data diambil dari rows yang sudah dimuat halaman.
export default function StudentNyekerHistory({
  open,
  onClose,
  student,
  records,
}) {
  if (!student) return null;
  const list = (records ?? [])
    .filter((r) => r.student_id === student.student_id)
    .sort((a, b) => (a.nyeker_date < b.nyeker_date ? 1 : -1));
  const terakhir = list[0]?.nyeker_date ?? null;

  return (
    <Modal open={open} onClose={onClose} title="Riwayat Nyeker" size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-soft p-3.5 border border-line rounded-xl">
          <Avatar name={student.full_name} size="md" />
          <div>
            <p className="font-semibold text-fg text-sm">
              {student.full_name}
            </p>
            <p className="text-fg-3 text-xs">{student.class_name}</p>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-2 text-center">
          <div className="bg-soft p-3 border border-line rounded-xl">
            <p className="text-[10px] text-fg-3 uppercase tracking-wider">
              Total Nyeker
            </p>
            <p className="mt-1 font-display font-bold text-rose-700 text-xl">
              {list.length} kali
            </p>
          </div>
          <div className="bg-soft p-3 border border-line rounded-xl">
            <p className="text-[10px] text-fg-3 uppercase tracking-wider">
              Terakhir
            </p>
            <p className="mt-1 font-display font-bold text-fg text-sm">
              {terakhir ? fmtDate(terakhir) : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 font-semibold text-[11px] text-fg-3 uppercase tracking-wider">
            Riwayat
          </p>
          {list.length === 0 ? (
            <EmptyState icon={Footprints} title="Belum ada catatan" />
          ) : (
            <ul className="border border-line rounded-xl divide-y divide-line">
              {list.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-fg text-sm">
                      {fmtDate(r.nyeker_date)}
                    </p>
                    <p className="text-[11px] text-fg-3">
                      {String(r.nyeker_time).slice(0, 5)}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
