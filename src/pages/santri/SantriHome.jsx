import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenCheck, CalendarClock, CalendarDays, ChevronRight, Flame, Footprints,
  MessagesSquare, ShieldCheck, Sparkles, Volleyball, ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useStudentData } from "../../layouts/StudentShell";
import { BkMascot } from "../../components/ui/BkMascot";
import { Card } from "../../components/ui/Card";
import { Bar, CountUp, Reveal, Ring } from "../../components/ui/Motion";
import { QISM_META } from "../shared/CalendarPage";
import { calendarService } from "../../services/calendarService";
import { hijriToday } from "../../lib/date";

const TILES = [
  { to: "/santri/kalender", label: "Kalender", icon: CalendarDays, tone: "bg-emerald-100 text-emerald-700" },
  { to: "/santri/zikir", label: "Jadwal Zikir", icon: CalendarClock, tone: "bg-violet-100 text-violet-700" },
  { to: "/santri/nadzhofah", label: "Nadzhofah", icon: Footprints, tone: "bg-amber-100 text-amber-700" },
  { to: "/santri/lughah", label: "Lughah", icon: BookOpenCheck, tone: "bg-sky-100 text-sky-700" },
  { to: "/santri/team", label: "Tim & Laga", icon: Volleyball, tone: "bg-rose-100 text-rose-700" },
  { to: "/santri/bk", label: "Kak Peci", icon: MessagesSquare, tone: "bg-teal-100 text-teal-700" },
];
const NUDGES = [
  "Satu kebiasaan baik hari ini, besok terasa lebih ringan.",
  "Jaga shalat berjamaah, sisanya ikut tertata.",
  "Kebersihan sebagian dari iman — mulai dari kasurmu.",
  "Bertanya itu tanda belajar. Jangan malu, ya!",
  "Kompak itu kuat. Dukung timmu hari ini.",
];
const fd = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const greet = () => {
  const h = new Date().getHours();
  return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
};

export default function SantriHome() {
  const { profile } = useAuth();
  const { stats, violations } = useStudentData();
  const [agenda, setAgenda] = useState([]);
  const first = (profile?.full_name ?? "").split(" ")[0] || "Santri";
  const recent = (violations ?? []).filter((v) => v.status !== "revoked").slice(0, 3);
  const nudge = useMemo(() => NUDGES[new Date().getDate() % NUDGES.length], []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    calendarService
      .list()
      .then((e) => setAgenda(e.filter((x) => x.end_date >= today).slice(0, 3)))
      .catch(() => {});
  }, []);

  // Suasana maskot mengikuti kondisi catatan
  const mood = stats.openCount >= 4 ? "sad" : stats.openCount >= 2 ? "care" : (stats.cleanDays ?? 99) >= 7 ? "dance" : "wave";
  const scoreTone = stats.score >= 80 ? "#22b573" : stats.score >= 50 ? "#f59e0b" : "#ef4d43";

  return (
    <div className="space-y-5 mx-auto max-w-3xl">
      <section className="relative flex items-center gap-4 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 sm:p-5 border-2 border-emerald-100 rounded-3xl overflow-hidden">
        <div aria-hidden="true" className="-top-10 -right-8 absolute bg-emerald-100/70 rounded-full size-36 intro-halo" />
        <div className="relative flex-1 min-w-0">
          <p className="inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 rounded-full font-bold text-brand-dim text-xs">
            <Sparkles size={13} />
            {hijriToday() ? `${hijriToday()} · ` : ""}
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="mt-1.5 font-display font-extrabold text-fg text-2xl sm:text-3xl leading-tight">
            {greet()}, {first}!
          </h1>
          <p className="mt-1 text-fg-3 text-sm">{nudge}</p>
        </div>
        <BkMascot mood={mood} size={96} interactive className="relative shrink-0" />
      </section>

      <section className="gap-3 grid grid-cols-2">
        <Reveal>
          <Card className="lift flex items-center gap-3 p-4 h-full">
            <Ring value={stats.score} tone={scoreTone} size={78} stroke={9} />
            <div className="min-w-0">
              <p className="font-extrabold text-fg text-sm leading-tight">Skor disiplin</p>
              <p className="mt-0.5 text-fg-3 text-xs">{stats.openCount ? `${stats.openCount} catatan aktif` : "Tanpa catatan aktif"}</p>
            </div>
          </Card>
        </Reveal>
        <Reveal delay={90}>
          <Card className="lift flex flex-col bg-orange-50 p-4 border-orange-200 h-full">
            <div className="flex items-center gap-2">
              <span className="place-items-center grid bg-orange-100 rounded-xl size-10 text-orange-600"><Flame size={22} className="animate-float" /></span>
              <CountUp value={stats.cleanDays ?? 0} className="font-display font-black text-orange-950 text-3xl leading-none" />
            </div>
            <p className="mt-2 font-bold text-orange-950 text-sm">Hari bersih</p>
            <p className="text-orange-800/80 text-xs">{stats.cleanDays == null ? "Belum ada pelanggaran" : "sejak catatan terakhir"}</p>
          </Card>
        </Reveal>
      </section>

      <Reveal>
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="inline-flex items-center gap-1.5 font-extrabold text-fg text-sm"><ShieldCheck size={16} className="text-brand-dim" /> Menuju 30 hari bersih</p>
            <span className="font-bold text-fg-3 text-xs">{Math.min(stats.cleanDays ?? 30, 30)}/30</span>
          </div>
          <Bar value={Math.min(stats.cleanDays ?? 30, 30)} max={30} tone="linear-gradient(90deg,#22b573,#34d399)" height={10} />
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-line border-b">
            <div>
              <h2 className="font-bold text-fg text-base">Agenda OSIS</h2>
              <p className="text-fg-3 text-xs">Dari semua qism</p>
            </div>
            <Link to="/santri/kalender" className="flex items-center font-semibold text-brand-dim text-xs">Kalender <ChevronRight size={14} /></Link>
          </div>
          <ul className="p-2 stagger">
            {agenda.map((e) => {
              const m = QISM_META[e.qism] ?? QISM_META.umum;
              return (
                <li key={e.id} className={`${m.q} flex items-center gap-3 px-3 py-2`}>
                  <span className="grid place-items-center rounded-xl size-11 font-extrabold text-xs text-center leading-tight shrink-0" style={{ background: "var(--q-tint)", color: "var(--q-dim)" }}>{fd(e.start_date)}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-fg text-sm truncate">{e.title}</span>
                    <span className="block font-semibold text-xs" style={{ color: "var(--q-dim)" }}>{m.label}</span>
                  </span>
                </li>
              );
            })}
            {!agenda.length && <li className="px-3 py-5 text-fg-3 text-sm text-center">Belum ada agenda mendatang.</li>}
          </ul>
        </Card>
      </Reveal>

      <Link to="/santri/bk" className="group flex items-center gap-3 bg-tint p-3 pr-4 border border-tint-line rounded-2xl lift">
        <BkMascot mood="care" size={48} />
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-brand-dim text-sm">Lagi ada yang dipikirkan?</span>
          <span className="block text-fg-2 text-xs">Pilih topik dan ngobrol santai dengan Kak Peci</span>
        </span>
        <MessagesSquare size={18} className="group-hover:translate-x-0.5 text-brand-dim transition-transform" />
      </Link>

      <section className="space-y-2">
        <h2 className="px-1 font-bold text-fg text-base">Jelajahi</h2>
        <div className="gap-3 grid grid-cols-2 sm:grid-cols-3 stagger">
          {TILES.map((t) => (
            <Link key={t.to} to={t.to} className="group lift flex items-center gap-3 p-3 card">
              <span className={`place-items-center grid rounded-xl size-10 shrink-0 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${t.tone}`}>
                <t.icon size={18} />
              </span>
              <span className="font-semibold text-fg-2 text-xs leading-tight">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <Reveal>
          <Card>
            <div className="flex items-center justify-between px-4 py-3 border-line border-b">
              <h2 className="inline-flex items-center gap-1.5 font-bold text-fg text-base"><ClipboardList size={16} /> Catatan terbaru</h2>
              <Link to="/santri/violations" className="flex items-center font-semibold text-brand-dim text-xs">Semua <ChevronRight size={14} /></Link>
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
        </Reveal>
      )}
    </div>
  );
}
