import { useStudentData } from "../../layouts/StudentShell";
import { HeartRow, Star } from "../../components/ui/HeartStar";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";

const RULES = [
  ["5 hati tiap periode", "Setiap 2 pekan (mulai 9 Okt) kamu punya 5 hati."],
  ["Pelanggaran ibadah = hati hilang", "Hilang sesuai poin: poin 1 → 1 hati, poin 3 → 3 hati."],
  ["Hati habis = absensi penghukuman", "Kamu wajib hadir pada absensi penghukuman periode itu."],
  ["Hati utuh 2 pekan = 1 bintang", "Bintangmu tersimpan sampai akhir semester sebagai catatan konsistensi."],
  ["2 pelanggaran Nadzhofah/Riyadhah = −1 bintang", "Setiap dua pelanggaran dari Nadzhofah atau Riyadhah, bintangmu berkurang satu."],
];

export default function SantriStars() {
  const { me, board } = useStudentData();
  return (
    <div className="space-y-5 mx-auto max-w-2xl">
      <PageHeader title="Hati & Bintang" description="Rawat hatimu, kumpulkan bintang dari kebiasaan baik, dan lihat progresmu bareng teman-teman." />
      <Card className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 sm:p-5 overflow-hidden border-rose-100">
        <div aria-hidden="true" className="-top-8 -right-7 absolute bg-amber-100/70 rounded-full size-24" />
        <div className="relative gap-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="bg-white/75 p-3.5 rounded-2xl">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-fg text-sm">Hati periode ini</p>
              <span className="bg-rose-100 px-2 py-1 rounded-full font-bold text-rose-700 text-[11px]">
                {me ? `${Math.max(0, me.days_left)} hari lagi` : "Memuat…"}
              </span>
            </div>
            <div className="mt-2"><HeartRow hearts={me?.hearts ?? 5} size={32} /></div>
            <p className="mt-1 text-fg-3 text-xs">
              {me ? `${me.hearts} dari 5 hati` : "Memuat data hati…"}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-amber-100/80 p-3.5 rounded-2xl sm:min-w-40">
            <Star size={34} />
            <div>
              <p className="font-extrabold text-amber-950 text-3xl leading-none">{me?.stars ?? 0}</p>
              <p className="mt-1 font-semibold text-amber-900 text-xs">Bintang terkumpul</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="px-4 py-3 border-line border-b font-bold text-fg text-base">Cara mengumpulkan bintang</h2>
        <ul className="space-y-3 p-4">
          {RULES.map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="place-items-center grid bg-tint rounded-lg size-7 font-bold text-brand-dim text-xs shrink-0">{i + 1}</span>
              <div><p className="font-semibold text-fg text-sm">{t}</p><p className="text-fg-3 text-xs">{d}</p></div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="px-4 py-3 border-line border-b">
          <h2 className="font-bold text-fg text-base">Peringkat bintang</h2>
          <p className="text-fg-3 text-xs">Progres seluruh teman satu sekolah</p>
        </div>
        <ol className="p-2">
          {board.map((r, i) => (
            <li key={r.student_id} className={`flex items-center gap-3 px-3 py-2 ${r.student_id === me?.student_id ? "bg-tint rounded-lg" : ""}`}>
              <span className={`grid place-items-center rounded-full size-7 font-semibold text-xs ${i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-soft-2 text-fg-3"}`}>{i + 1}</span>
              <span className="flex-1 min-w-0 font-semibold text-fg text-sm truncate">{r.full_name}<span className="ml-1.5 font-normal text-fg-4 text-xs">{r.class_name}</span></span>
              <span className="flex items-center gap-1 font-semibold text-fg-2 text-sm">{r.stars}<Star size={14} /></span>
            </li>
          ))}
          {board.length === 0 && (
            <li className="px-3 py-5 text-fg-3 text-sm text-center">Papan bintang akan muncul setelah data tersedia.</li>
          )}
        </ol>
      </Card>
    </div>
  );
}
