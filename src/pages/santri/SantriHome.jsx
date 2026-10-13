import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, CalendarClock, BookOpenCheck, Footprints, MessagesSquare, ShieldCheck, Sparkles, Volleyball } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudentData } from "../../layouts/StudentShell";
import { BkMascot } from "../../components/ui/BkMascot";
import { HeartRow, Star } from "../../components/ui/HeartStar";
import { Card } from "../../components/ui/Card";
import { hijriToday } from "../../lib/date";

const TILES = [
  { to: "/santri/zikir", label: "Jadwal Zikir", icon: CalendarClock, tone: "bg-violet-100 text-violet-700" },
  { to: "/santri/nadzhofah", label: "Nadzhofah", icon: Footprints, tone: "bg-amber-100 text-amber-700" },
  { to: "/santri/lughah", label: "Lughah", icon: BookOpenCheck, tone: "bg-sky-100 text-sky-700" },
  { to: "/santri/team", label: "Tim & Laga", icon: Volleyball, tone: "bg-rose-100 text-rose-700" },
];
const fd = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

export default function SantriHome() {
  const { profile } = useAuth();
  const { stats, violations, me, board } = useStudentData();
  const first = (profile?.full_name ?? "").split(" ")[0] || "Santri";
  const hearts = me?.hearts ?? 5;
  const heartCount = Math.max(0, Math.min(5, Number(hearts) || 0));
  const mascotMood =
    heartCount === 0 ? "angry"
      : heartCount === 1 ? "upset"
        : heartCount === 2 ? "verySad"
          : heartCount <= 4 ? "sad"
            : "happy";
  const rank = me ? board.findIndex((r) => r.student_id === me.student_id) + 1 : 0;
  const recent = (violations ?? []).filter((v) => v.status !== "revoked").slice(0, 3);
  const danger = me?.in_punishment;

  return (
    <div className="space-y-5 mx-auto max-w-3xl">
      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 bg-tint px-2.5 py-1 rounded-full font-bold text-brand-dim text-xs">
            <Sparkles size={13} />
            {hijriToday() ? `${hijriToday()} · ` : ""}
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1 font-display font-extrabold text-fg text-2xl sm:text-3xl leading-tight">
            Assalamu’alaikum, {first}
          </h1>
          <p className="mt-1 text-fg-3 text-sm">
            {heartCount === 0
              ? "Kak Peci lagi bad mood. Yuk, pelan-pelan bangkit lagi. Periode baru selalu jadi kesempatan baru."
              : heartCount === 1
                ? "Kak Peci lagi baper. Satu hati lagi tersisa—jaga baik-baik, ya."
                : heartCount === 2
                  ? "Kak Peci sedih banget. Tinggal dua hati. Masih ada waktu buat memperbaiki."
                  : heartCount <= 4
                    ? "Kak Peci ikut sedih. Yuk, jaga hati yang tersisa dan lanjutkan kebiasaan baik."
                    : "Kak Peci ikut senang! Hati masih utuh—pertahankan kebiasaan baikmu."}
          </p>
        </div>
        <BkMascot mood={mascotMood} size={80} className="shrink-0" />
      </section>

      <Card className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50 p-4 sm:p-5 overflow-hidden border-rose-100">
        <div aria-hidden="true" className="-top-8 -right-7 absolute bg-amber-100/70 rounded-full size-24" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-fg text-sm">Hati periode ini</h2>
            {me && (
              <p className="mt-0.5 text-fg-3 text-xs">
                {fd(me.period_start)} – {fd(me.period_end)}
              </p>
            )}
          </div>
          <span className="relative bg-white/80 px-2.5 py-1 rounded-full font-bold text-fg-2 text-xs">
            {me ? `${Math.max(0, me.days_left)} hari lagi` : "Memuat…"}
          </span>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-3 mt-4">
          <HeartRow hearts={heartCount} size={35} />
          <span className="bg-white/80 px-3 py-1.5 rounded-full font-bold text-rose-700 text-xs">
            {heartCount === 5 ? "Sempurna!" : heartCount === 0 ? "Isi lagi di periode depan" : `${heartCount} dari 5 hati`}
          </span>
        </div>
        <div className="relative flex gap-1.5 mt-4" role="img" aria-label={`${heartCount} dari 5 hati tersisa`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`h-2 flex-1 rounded-full ${i < heartCount ? "bg-rose-400" : "bg-rose-100"}`} />
          ))}
        </div>

        {danger && (
          <div className="flex items-start gap-2.5 bg-rose-50 mt-4 p-3 border border-rose-200 rounded-xl">
            <AlertTriangle size={18} className="mt-0.5 text-rose-600 shrink-0" />
            <p className="font-semibold text-rose-800 text-sm">
              Kamu masuk <b>absensi penghukuman</b> periode ini. Hadirlah sesuai arahan Qism Ibadah.
            </p>
          </div>
        )}
      </Card>

      <section className="gap-3 grid grid-cols-2">
        <Link to="/santri/bintang" className="card card-press group flex flex-col bg-amber-50 p-4 border-amber-200">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center bg-amber-100 rounded-xl size-10 group-hover:-rotate-6 group-hover:scale-105 transition-transform">
              <Star size={27} />
            </span>
            <span className="font-extrabold text-amber-900 text-3xl leading-none">{me?.stars ?? 0}</span>
          </div>
          <p className="mt-2 font-bold text-amber-950 text-sm">Bintang terkumpul</p>
          <p className="text-amber-800/80 text-xs">{rank > 0 ? `Peringkat #${rank} dari ${board.length}` : "Lihat papan bintang"}</p>
        </Link>
        <Card className="flex flex-col bg-emerald-50 p-4 border-emerald-200">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center bg-emerald-100 rounded-xl size-10 text-emerald-700">
              <ShieldCheck size={23} />
            </span>
            <span className="font-extrabold text-emerald-950 text-3xl leading-none">{stats.cleanDays ?? "✓"}</span>
          </div>
          <p className="mt-2 font-bold text-emerald-950 text-sm">Hari bersih</p>
          <p className="text-emerald-800/80 text-xs">{stats.cleanDays == null ? "Belum ada pelanggaran" : "sejak pelanggaran terakhir"}</p>
        </Card>
      </section>

      <Link to="/santri/bk" className="flex items-center gap-3 bg-tint p-3 pr-4 border border-tint-line rounded-xl">
        <BkMascot mood="care" size={48} />
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-brand-dim text-sm">Lagi ada yang dipikirkan?</span>
          <span className="block text-fg-2 text-xs">Ngobrol santai dengan Kak Peci</span>
        </span>
        <MessagesSquare size={18} className="text-brand-dim" />
      </Link>

      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-line border-b">
          <div>
            <h2 className="font-bold text-fg text-base">Papan Bintang</h2>
            <p className="text-fg-3 text-xs">Lihat progres teman-teman</p>
          </div>
          <Link to="/santri/bintang" className="flex items-center font-semibold text-brand-dim text-xs">
            Semua <ChevronRight size={14} />
          </Link>
        </div>
        <ol className="p-2">
          {board.slice(0, 5).map((r, i) => (
            <li key={r.student_id} className={`flex items-center gap-3 px-3 py-2 ${r.student_id === me?.student_id ? "bg-tint rounded-lg" : ""}`}>
              <span className={`grid place-items-center rounded-full size-7 font-bold text-xs ${i === 0 ? "bg-amber-100 text-amber-800" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-soft-2 text-fg-3"}`}>{i + 1}</span>
              <span className="flex-1 min-w-0 font-semibold text-fg text-sm truncate">
                {r.full_name}<span className="ml-1.5 font-normal text-fg-4 text-xs">{r.class_name}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-fg-2 text-sm">{r.stars}<Star size={14} /></span>
            </li>
          ))}
          {board.length === 0 && <li className="px-3 py-5 text-fg-3 text-sm text-center">Belum ada data bintang.</li>}
        </ol>
      </Card>

      <section className="space-y-2">
        <h2 className="px-1 font-bold text-fg text-base">Jelajahi</h2>
        <div className="gap-3 grid grid-cols-2 sm:grid-cols-4">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="card card-press flex items-center gap-3 p-3">
            <span className={`place-items-center grid rounded-xl size-10 shrink-0 ${t.tone}`}>
              <t.icon size={18} />
            </span>
            <span className="font-semibold text-xs text-fg-2 leading-tight">{t.label}</span>
          </Link>
        ))}
        </div>
      </section>

      {recent.length > 0 && (
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-line border-b">
            <h2 className="font-bold text-fg text-base">Catatan terbaru</h2>
            <Link to="/santri/violations" className="flex items-center font-semibold text-brand-dim text-xs">
              Semua <ChevronRight size={14} />
            </Link>
          </div>
          <ul className="p-2">
            {recent.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 min-w-0 font-semibold text-fg text-sm truncate">{v.rule?.name}</span>
                <span className="font-semibold text-fg-4 text-xs">{fd(v.occurred_at)}</span>
                <span className="bg-rose-50 px-2 py-0.5 rounded-full font-semibold text-rose-700 text-xs">−{v.rule?.points ?? 0}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
