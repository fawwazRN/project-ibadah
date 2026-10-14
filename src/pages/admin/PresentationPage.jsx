// Presentasi layar penuh untuk TV / laptop — dipandu maskot "Kak Peci".
// Gaya: ceria ala aplikasi belajar (tombol 3D tebal, papan liga, progres bersegmen).
// Mode otomatis (geser tiap 20 detik) atau manual (← / → / klik / tombol).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ban, BookOpenCheck, CalendarClock, CalendarDays, Flag, Footprints, HeartHandshake, History, Maximize, Medal,
  MessageSquareWarning, MessagesSquare, Minimize, Newspaper, Pause, Play, Printer, Scale, ShieldCheck, Smartphone,
  Sparkles, Target, Trophy, Volleyball, X, Users,
} from "lucide-react";
import { BkMascot } from "../../components/ui/BkMascot";
import { leaderboardService } from "../../services/leaderboardService";
import { nyekerService } from "../../services/nyekerService";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { computeStandings } from "../../utils/standings";

const SLIDE_MS = 20000;
const SITE_LABEL = "project-osis.vercel.app";
const N = 7;
const U = (n) => `calc(var(--u) * ${n})`; // 1u ≈ 1% lebar layar (dibatasi tinggi layar)

// palet ceria: c = warna, d = bayangan tebal, t = tint lembut
const PAL = {
  green: { c: "#58cc02", d: "#58a700", t: "#e9f9d6" },
  blue: { c: "#1cb0f6", d: "#1899d6", t: "#dff3fe" },
  red: { c: "#ff4b4b", d: "#ea2b2b", t: "#ffe3e3" },
  orange: { c: "#ff9600", d: "#e08600", t: "#fff0d6" },
  purple: { c: "#ce82ff", d: "#a568cc", t: "#f5e6ff" },
  yellow: { c: "#ffc800", d: "#e5b400", t: "#fff6cc" },
};
const THEMES = [PAL.red, PAL.green, PAL.orange, PAL.blue, PAL.purple, PAL.yellow, PAL.green];
const CYCLE = [PAL.green, PAL.blue, PAL.purple, PAL.orange, PAL.red, PAL.yellow];
const INK = "#3c3c3c";
const MUTED = "#777777";
const LINE = "#e5e5e5";

const CSS = `
@keyframes pres-in{from{opacity:0;transform:translateX(5%)}to{opacity:1;transform:none}}
@keyframes pres-pop{0%{opacity:0;transform:translateY(30px) scale(.9)}60%{opacity:1;transform:translateY(-6px) scale(1.03)}100%{opacity:1;transform:none}}
@keyframes pres-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pres-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes pres-wiggle{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes pres-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes pres-caret{50%{opacity:0}}
@keyframes pres-conf{0%{transform:translateY(-10vh) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:.95}}
.pres-in{animation:pres-in .55s cubic-bezier(.22,1,.36,1) both}
.pres-pop{animation:pres-pop .7s cubic-bezier(.34,1.56,.64,1) both}
.pres-bar{transform-origin:left;animation:pres-grow 1.1s cubic-bezier(.22,1,.36,1) both}
.pres-bounce{animation:pres-bounce 1.4s ease-in-out infinite}
.pres-wiggle{animation:pres-wiggle 1.6s ease-in-out infinite}
.pres-pulse{animation:pres-pulse 1.6s ease-in-out infinite}
.pres-caret{animation:pres-caret 1s steps(1) infinite}
.pres-btn{transition:transform .08s,box-shadow .08s}
.pres-btn:active{transform:translateY(4px);box-shadow:0 0 0 transparent!important}
@media (prefers-reduced-motion:reduce){.pres-in,.pres-pop,.pres-bar,.pres-bounce,.pres-wiggle,.pres-pulse{animation:none!important}}
`;

// ---------------------------------------------------------------- hooks
function useTypewriter(text, speed = 24) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(t), v) : v + 1)), speed);
    return () => clearInterval(t);
  }, [text, speed]);
  return text.slice(0, n);
}

function useViewportH() {
  const [h, setH] = useState(typeof window === "undefined" ? 800 : window.innerHeight);
  useEffect(() => {
    const on = () => setH(window.innerHeight);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return h;
}

function CountUp({ to = 0, ms = 1200 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <>{v}</>;
}

// ---------------------------------------------------------------- data
async function loadData() {
  const [ibadah, nadz, league] = await Promise.allSettled([
    leaderboardService.get(),
    nyekerService.naughtyLeaderboard(),
    (async () => {
      const ctx = await leagueService.getContext();
      const [teams, matches, settings, players] = await Promise.all([
        leagueService.listTeams(ctx.phase_id),
        matchService.list(ctx.season_id),
        leagueService.getSettings(),
        matchService.playerStats(ctx.season_id),
      ]);
      const official = (matches ?? []).filter((m) => m.status === "official");
      return {
        ctx,
        teams: computeStandings(teams, official, settings.tiebreak_order).slice(0, 5),
        players: (players ?? [])
          .filter((p) => p.goals > 0)
          .sort((a, b) => b.goals - a.goals || a.yellow - b.yellow || a.full_name.localeCompare(b.full_name))
          .slice(0, 5),
      };
    })(),
  ]);
  const ok = (r, fallback) => (r.status === "fulfilled" && r.value ? r.value : fallback);
  return {
    ibadah: ok(ibadah, []).slice(0, 5),
    nadz: [...ok(nadz, [])].sort((a, b) => (b.naughty_score ?? 0) - (a.naughty_score ?? 0)).slice(0, 5),
    league: ok(league, { ctx: null, teams: [], players: [] }),
  };
}

// ---------------------------------------------------------------- komponen dasar
// kartu bergaya "tombol tebal": border + bayangan bawah
const chunk = (color = LINE, depth = 5) => ({ border: `2px solid ${color}`, borderBottomWidth: depth });

function Heading({ theme, tag, title, sub, icon: Icon }) {
  return (
    <div className="flex items-center" style={{ gap: U(1.6) }}>
      <span className="pres-pop grid place-items-center rounded-[1.4rem] text-white shrink-0"
        style={{ width: U(5.6), height: U(5.6), background: theme.c, boxShadow: `0 ${U(.45)} 0 ${theme.d}` }}>
        <Icon style={{ width: U(3), height: U(3) }} strokeWidth={2.6} />
      </span>
      <div className="min-w-0">
        <span className="inline-block rounded-full font-black text-white uppercase tracking-wider"
          style={{ background: theme.c, fontSize: U(.95), padding: `${U(.2)} ${U(.9)}` }}>{tag}</span>
        <h1 className="font-black tracking-tight leading-tight" style={{ fontSize: U(3.3), color: INK }}>{title}</h1>
        {sub && <p className="font-bold" style={{ fontSize: U(1.3), color: MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

function Empty({ text, theme }) {
  return (
    <div className="pres-pop place-items-center grid rounded-3xl h-full font-black text-center"
      style={{ ...chunk(theme.c), background: theme.t, color: theme.d, fontSize: U(2), padding: U(2) }}>
      {text}
    </div>
  );
}

const initials = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const Avatar = ({ name, i, size = 4.4 }) => (
  <span className="grid place-items-center rounded-full font-black text-white shrink-0"
    style={{ width: U(size), height: U(size), fontSize: U(size * 0.38), background: CYCLE[i % CYCLE.length].c, boxShadow: `0 ${U(.3)} 0 ${CYCLE[i % CYCLE.length].d}` }}>
    {initials(name)}
  </span>
);

const RankBadge = ({ i }) =>
  i < 3 ? (
    <span style={{ fontSize: U(3), width: U(3.4), textAlign: "center" }}>{["🥇", "🥈", "🥉"][i]}</span>
  ) : (
    <span className="font-black text-center" style={{ fontSize: U(1.9), width: U(3.4), color: MUTED }}>{i + 1}</span>
  );

// papan peringkat ala "liga"
function LeagueRows({ rows, theme, unit }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex flex-col justify-center gap-[1.3vh] h-full">
      {rows.map((r, i) => (
        <div key={r.key} className="pres-pop relative flex items-center bg-white rounded-3xl"
          style={{
            ...chunk(i === 0 ? theme.c : LINE), background: i === 0 ? theme.t : "#fff",
            animationDelay: `${0.1 + i * 0.12}s`, gap: U(1.3), padding: `${U(.9)} ${U(1.6)}`,
          }}>
          <RankBadge i={i} />
          <Avatar name={r.name} i={i} />
          <div className="min-w-0" style={{ width: U(17) }}>
            <p className="font-black truncate" style={{ fontSize: U(1.8), color: INK }}>
              {r.name} {i === 0 && <span className="inline-block pres-wiggle">👑</span>}
            </p>
            <p className="font-bold truncate" style={{ fontSize: U(1.05), color: MUTED }}>{r.sub}</p>
          </div>
          <div className="relative flex-1 rounded-full overflow-hidden" style={{ height: U(1.7), background: "#eee" }}>
            <div className="relative rounded-full h-full pres-bar"
              style={{ width: `${Math.max(7, (r.value / max) * 100)}%`, background: theme.c, animationDelay: `${0.3 + i * 0.12}s` }}>
              <span className="top-[22%] right-3 left-3 absolute bg-white/40 rounded-full h-[22%]" />
            </div>
          </div>
          <p className="font-black tabular-nums text-right" style={{ minWidth: U(9), fontSize: U(2.4), color: theme.d }}>
            <CountUp to={r.value} /> <span style={{ fontSize: U(1), color: MUTED }}>{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- slide
function SlideIbadah({ data, theme }) {
  const rows = data.ibadah.map((r) => ({
    key: r.santri_id ?? r.student_id ?? r.full_name, name: r.full_name,
    sub: `Kelas ${r.class_name ?? "—"} · ${r.violation_count ?? 0} pelanggaran`, value: r.score ?? 0,
  }));
  return (
    <div className="flex flex-col h-full" style={{ gap: U(1.4) }}>
      <Heading theme={theme} icon={Flag} tag="Top 5 · Qism Ibadah" title="Pelanggar Ibadah Bulan Ini" sub="Berdasarkan poin pelanggaran bulan berjalan" />
      <div className="flex-1 min-h-0">
        {rows.length ? <LeagueRows rows={rows} theme={theme} unit="poin" />
          : <Empty theme={PAL.green} text="Alhamdulillah, belum ada pelanggaran bulan ini! 🎉" />}
      </div>
    </div>
  );
}

function SlideFutsal({ data, theme }) {
  const { ctx, teams, players } = data.league;
  const Panel = ({ color, icon: Icon, title, children }) => (
    <div className="flex flex-col bg-white rounded-[2rem] min-h-0 overflow-hidden" style={chunk(LINE, 6)}>
      <div className="flex items-center font-black text-white" style={{ background: color.c, gap: U(.8), fontSize: U(1.7), padding: `${U(.9)} ${U(1.6)}` }}>
        <Icon style={{ width: U(2.1), height: U(2.1) }} strokeWidth={2.6} /> {title}
      </div>
      <div className="flex flex-col flex-1 justify-center gap-[1vh]" style={{ padding: U(1.3) }}>{children}</div>
    </div>
  );
  const Row = ({ i, name, sub, value, max, unit, color }) => (
    <div className="pres-pop flex items-center" style={{ gap: U(1), animationDelay: `${0.15 + i * 0.1}s` }}>
      <RankBadge i={i} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline" style={{ gap: U(1) }}>
          <p className="font-black truncate" style={{ fontSize: U(1.5), color: INK }}>{name}</p>
          <span className="font-black tabular-nums" style={{ fontSize: U(1.8), color: color.d }}>
            <CountUp to={value} /> <small style={{ fontSize: U(.9), color: MUTED }}>{unit}</small>
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: U(.9), background: "#eee" }}>
          <div className="rounded-full h-full pres-bar" style={{ width: `${Math.max(8, (value / max) * 100)}%`, background: color.c, animationDelay: `${0.3 + i * 0.1}s` }} />
        </div>
        <p className="font-bold truncate" style={{ fontSize: U(.95), color: MUTED }}>{sub}</p>
      </div>
    </div>
  );
  const maxP = Math.max(...teams.map((t) => t.points), 1);
  const maxG = Math.max(...players.map((p) => p.goals), 1);
  return (
    <div className="flex flex-col h-full" style={{ gap: U(1.4) }}>
      <Heading theme={theme} icon={Volleyball} tag="Top 5 · Qism Riyadhah" title="Pemain & Tim Futsal Terbaik"
        sub={ctx ? `${ctx.phase_name} · ${ctx.season_name} — hanya laga resmi` : "Liga futsal OSIS"} />
      <div className="gap-[1.8vw] grid grid-cols-2 flex-1 min-h-0">
        <Panel color={PAL.blue} icon={Trophy} title="Klasemen Tim">
          {teams.length ? teams.map((t, i) => <Row key={t.team_id} i={i} name={t.name} sub={`${t.played} laga · SG ${t.gd > 0 ? "+" : ""}${t.gd}`} value={t.points} max={maxP} unit="poin" color={PAL.blue} />)
            : <p className="font-bold" style={{ color: MUTED }}>Belum ada klasemen</p>}
        </Panel>
        <Panel color={PAL.orange} icon={Target} title="Top Skor Pemain">
          {players.length ? players.map((p, i) => <Row key={p.student_id ?? p.full_name} i={i} name={p.full_name} sub={`${p.team_name ?? "—"} · ${p.appearances} laga`} value={p.goals} max={maxG} unit="gol ⚽" color={PAL.orange} />)
            : <p className="font-bold" style={{ color: MUTED }}>Belum ada gol tercipta</p>}
        </Panel>
      </div>
    </div>
  );
}

function SlideNadzhofah({ data, theme }) {
  const rows = data.nadz.map((r) => ({
    key: r.student_id ?? r.full_name, name: r.full_name,
    sub: `Kelas ${r.class_name ?? "—"} · nyeker ${r.nyeker_count ?? 0}× · baju disita ${r.clothing_count ?? 0}×`, value: r.naughty_score ?? 0,
  }));
  return (
    <div className="flex flex-col h-full" style={{ gap: U(1.4) }}>
      <Heading theme={theme} icon={Footprints} tag="Top 5 · Nadzhofah" title="Pelanggar Kebersihan & Kerapian" sub="Gabungan nyeker + baju disita (lelang tidak dihitung)" />
      <div className="flex-1 min-h-0">
        {rows.length ? <LeagueRows rows={rows} theme={theme} unit="poin" />
          : <Empty theme={PAL.green} text="Semua santri rapi dan bersih, luar biasa! ✨" />}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    part: 1, title: "Teman & Suara Santri", sub: "Fitur untuk santri sehari-hari",
    items: [
      [MessagesSquare, "Kak Peci", "Teman curhat & konseling lewat chat pilihan jawaban."],
      [HeartHandshake, "Curhat ke OSIS", "Sampaikan unek-unek dan saran ke pengurus."],
      [Newspaper, "Artikel BK", "Bacaan ringan untuk menyegarkan pikiran."],
      [Flag, "Catatanku", "Lihat riwayat pelanggaran dan poinmu."],
      [CalendarDays, "Kalender OSIS", "Semua agenda kegiatan dalam satu tampilan."],
      [MessageSquareWarning, "Laporanku", "Laporkan kejadian & pantau tindak lanjutnya."],
    ],
  },
  {
    part: 2, title: "Qism & Kompetisi", sub: "Setiap qism punya ruang kerjanya sendiri",
    items: [
      [Trophy, "Klasemen & Tim", "Liga futsal: jadwal, hasil, klasemen, top skor."],
      [Medal, "Papan Peringkat", "Peringkat poin ibadah & nadzhofah otomatis."],
      [Footprints, "Nadzhofah", "Catat nyeker, baju disita, dan denda."],
      [BookOpenCheck, "Lughah", "Input nilai, kelengkapan, dan rekap bahasa."],
      [CalendarClock, "Jadwal Zikir", "Jadwal petugas zikir yang jelas."],
      [Ban, "Kartu & Suspensi", "Kartu & suspensi dihitung otomatis."],
    ],
  },
  {
    part: 3, title: "Rapi, Aman & Praktis", sub: "Di balik layar yang bikin semuanya lancar",
    items: [
      [Scale, "Aturan Poin", "Poin tiap pelanggaran dikelola admin."],
      [Printer, "Rekap & Cetak", "Laporan siap cetak untuk rapat & evaluasi."],
      [History, "Log Audit", "Setiap perubahan penting tercatat."],
      [ShieldCheck, "Peran & Akses", "Pengguna hanya melihat yang jadi haknya."],
      [Sparkles, "Undangan Digital", "Halaman undangan acara yang interaktif."],
      [Smartphone, "Pasang di HP", "Bisa dipasang seperti aplikasi."],
    ],
  },
];

function SlideFeatures({ f, theme }) {
  return (
    <div className="flex flex-col h-full" style={{ gap: U(1.4) }}>
      <Heading theme={theme} icon={Users} tag={`Fitur web · Bagian ${f.part} dari 3`} title={f.title} sub={f.sub} />
      <div className="gap-[1.2vw] grid grid-cols-3 grid-rows-2 flex-1 min-h-0">
        {f.items.map(([Icon, name, desc], i) => {
          const c = CYCLE[(i + f.part) % CYCLE.length];
          return (
            <div key={name} className="pres-pop flex items-center bg-white rounded-[2rem]"
              style={{ ...chunk(LINE, 6), animationDelay: `${0.1 + i * 0.09}s`, gap: U(1.2), padding: U(1.3) }}>
              <span className="grid place-items-center rounded-2xl text-white shrink-0"
                style={{ width: U(5), height: U(5), background: c.c, boxShadow: `0 ${U(.4)} 0 ${c.d}` }}>
                <Icon style={{ width: U(2.7), height: U(2.7) }} strokeWidth={2.6} />
              </span>
              <div className="min-w-0">
                <p className="font-black leading-tight" style={{ fontSize: U(1.7), color: INK }}>{name}</p>
                <p className="mt-1 font-bold leading-snug" style={{ fontSize: U(1.1), color: MUTED }}>{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideEnd() {
  const cards = [
    ["📊", "Semua tercatat transparan", PAL.green],
    ["💬", "Ada Kak Peci & artikel penyegar", PAL.blue],
    ["📱", "Bisa dibuka di HP kapan saja", PAL.purple],
  ];
  return (
    <div className="relative flex flex-col justify-center items-center h-full text-center" style={{ gap: U(1.6) }}>
      {Array.from({ length: 26 }).map((_, i) => (
        <span key={i} aria-hidden="true" className="top-0 absolute rounded-sm"
          style={{ left: `${(i * 3.9) % 100}%`, width: U(.8), height: U(1.2), background: Object.values(PAL)[i % 6].c,
            animation: `pres-conf ${5 + (i % 5)}s linear ${(i % 8) * 0.5}s infinite` }} />
      ))}
      <span className="pres-bounce" style={{ fontSize: U(8) }}>🏆</span>
      <h1 className="pres-pop font-black tracking-tight" style={{ fontSize: U(4.6), color: PAL.yellow.d, animationDelay: ".1s" }}>Pelajaran Selesai!</h1>
      <p className="pres-pop font-bold" style={{ fontSize: U(1.7), color: INK, animationDelay: ".2s" }}>Yuk jadi santri yang lebih baik, sedikit demi sedikit 🌱</p>
      <div className="flex" style={{ gap: U(1.2) }}>
        {cards.map(([e, t, c], i) => (
          <div key={t} className="pres-pop rounded-3xl" style={{ ...chunk(c.c, 6), background: c.t, animationDelay: `${0.35 + i * 0.12}s`, padding: `${U(1.2)} ${U(1.6)}`, width: U(15) }}>
            <div style={{ fontSize: U(3) }}>{e}</div>
            <p className="font-black leading-snug" style={{ fontSize: U(1.3), color: c.d }}>{t}</p>
          </div>
        ))}
      </div>
      <div className="pres-pop pres-pulse rounded-full font-black text-white"
        style={{ background: PAL.green.c, boxShadow: `0 ${U(.6)} 0 ${PAL.green.d}`, padding: `${U(1)} ${U(3.2)}`, animationDelay: ".8s" }}>
        <p className="opacity-90 uppercase tracking-widest" style={{ fontSize: U(.95) }}>Kunjungi sekarang</p>
        <p style={{ fontSize: U(3.2) }}>{SITE_LABEL}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- narasi maskot
function narration(i, d) {
  const top = d.ibadah[0], pl = d.league.players[0], tm = d.league.teams[0];
  return [
    `Assalamu'alaikum, aku Kak Peci! Yuk lihat 5 santri dengan poin pelanggaran ibadah tertinggi bulan ini${top ? `, tertinggi ${top.score} poin` : ""}. Kita saling mengingatkan ya!`,
    `Sekarang seru-seruan futsal! ${tm ? `Tim ${tm.name} memimpin klasemen. ` : ""}${pl ? `Top skor: ${pl.full_name} dengan ${pl.goals} gol!` : "Gol-gol pertama masih ditunggu!"}`,
    "Nadzhofah itu tentang kebersihan dan kerapian. Ini 5 santri dengan poin nyeker dan baju disita terbanyak. Semangat memperbaiki diri!",
    "Sekarang kenalan dengan fitur web ini. Bagian pertama: teman curhat, artikel, catatan pribadi, kalender, dan laporan untuk santri.",
    "Bagian kedua! Tiap qism punya ruang kerja sendiri: liga futsal, papan peringkat, nadzhofah, lughah, zikir, sampai kartu dan suspensi.",
    "Bagian ketiga: aturan poin otomatis, rekap siap cetak, log audit, pembagian akses, undangan digital, dan bisa dipasang di HP.",
    `Selesai! Yuk buka ${SITE_LABEL} sekarang dan pakai bersama teman-temanmu. Terima kasih sudah menonton!`,
  ][i];
}
const MOODS = ["care", "cheer", "think", "wave", "talk", "read", "dance"];

// tombol 3D
function Btn({ color = PAL.green, outline = false, children, style, ...p }) {
  return (
    <button {...p} className="pres-btn rounded-2xl font-black uppercase tracking-wider"
      style={{
        fontSize: U(1.3), padding: `${U(.9)} ${U(2.4)}`,
        background: outline ? "#fff" : color.c, color: outline ? MUTED : "#fff",
        border: outline ? `2px solid ${LINE}` : "none", boxShadow: `0 ${U(.4)} 0 ${outline ? LINE : color.d}`,
        ...style,
      }}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- halaman utama
export default function PresentationPage() {
  const nav = useNavigate();
  const vh = useViewportH();
  const [data, setData] = useState(null);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [prog, setProg] = useState(0);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState(true);
  const elapsed = useRef(0);
  const hideT = useRef();

  useEffect(() => { loadData().then(setData); }, []);

  const go = useCallback((n) => { elapsed.current = 0; setProg(0); setIdx(((n % N) + N) % N); }, []);

  useEffect(() => {
    if (!started || !auto) return;
    const t = setInterval(() => {
      elapsed.current += 100;
      setProg(elapsed.current / SLIDE_MS);
      if (elapsed.current >= SLIDE_MS) { elapsed.current = 0; setProg(0); setIdx((v) => (v + 1) % N); }
    }, 100);
    return () => clearInterval(t);
  }, [started, auto]);

  const toggleFull = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* ditolak browser */ }
  }, []);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  useEffect(() => {
    if (!started || !navigator.wakeLock) return;
    let lock;
    navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    return () => lock?.release?.().catch(() => {});
  }, [started]);

  useEffect(() => {
    const wake = () => {
      setActive(true);
      clearTimeout(hideT.current);
      hideT.current = setTimeout(() => setActive(false), 3000);
    };
    const key = (e) => {
      wake();
      if (!started) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(idx - 1);
      else if (e.key === " " || e.key.toLowerCase() === "p") { e.preventDefault(); setAuto((v) => !v); }
      else if (e.key.toLowerCase() === "f") toggleFull();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(N - 1);
    };
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", key);
    wake();
    return () => { window.removeEventListener("mousemove", wake); window.removeEventListener("keydown", key); clearTimeout(hideT.current); };
  }, [started, idx, go, toggleFull]);

  const start = (fullscreen) => {
    setStarted(true); setIdx(0); setAuto(true); elapsed.current = 0;
    if (fullscreen) toggleFull();
  };
  const exit = () => { if (document.fullscreenElement) document.exitFullscreen(); nav("/admin"); };

  const theme = THEMES[idx];
  const text = data ? narration(idx, data) : "";
  const typed = useTypewriter(started ? text : "", 24);
  const slide = useMemo(() => {
    if (!data) return null;
    const t = THEMES[idx];
    return [<SlideIbadah data={data} theme={t} />, <SlideFutsal data={data} theme={t} />, <SlideNadzhofah data={data} theme={t} />,
      <SlideFeatures f={FEATURES[0]} theme={t} />, <SlideFeatures f={FEATURES[1]} theme={t} />, <SlideFeatures f={FEATURES[2]} theme={t} />,
      <SlideEnd />][idx];
  }, [data, idx]);

  const mascotSize = Math.round(Math.min(vh * 0.2, 170));

  return (
    <div className="z-[300] fixed inset-0 flex flex-col bg-white overflow-hidden font-sans select-none"
      style={{ "--u": "min(1vw, 1.78vh)", color: INK, cursor: active ? "default" : "none" }}>
      <style>{CSS}</style>

      {/* ------- layar mulai ------- */}
      {!started && (
        <div className="z-30 absolute inset-0 flex flex-col justify-center items-center bg-white text-center" style={{ gap: U(1.4) }}>
          <div className="flex items-end" style={{ gap: U(1) }}>
            <div className="pres-bounce"><BkMascot mood="wave" size={Math.round(vh * 0.28)} /></div>
            <div className="relative bg-white mb-[4vh] rounded-3xl font-black" style={{ ...chunk(LINE, 5), fontSize: U(1.6), padding: `${U(1)} ${U(1.6)}` }}>
              Yuk mulai! 👋
              <span className="bottom-4 -left-2 absolute bg-white border-b-2 border-l-2 size-4 rotate-45" style={{ borderColor: LINE }} />
            </div>
          </div>
          <h1 className="font-black tracking-tight" style={{ fontSize: U(5), color: PAL.green.c }}>Presentasi OSIS</h1>
          <p className="font-bold" style={{ fontSize: U(1.5), color: MUTED }}>Dipandu Kak Peci · 7 bagian · geser otomatis tiap 20 detik</p>
          <div className="flex flex-col items-center" style={{ gap: U(1), width: U(26) }}>
            <Btn onClick={() => start(true)} disabled={!data} style={{ width: "100%", fontSize: U(1.6), padding: U(1.1), background: PAL.green.c, color: "#fff", border: "none", boxShadow: `0 ${U(.5)} 0 ${PAL.green.d}`, opacity: data ? 1 : 0.6 }}>
              {data ? "Mulai (layar penuh)" : "Menyiapkan data…"}
            </Btn>
            <Btn outline onClick={() => start(false)} disabled={!data} style={{ width: "100%", fontSize: U(1.2), padding: U(.9), background: "#fff", color: PAL.blue.d, border: `2px solid ${LINE}`, boxShadow: `0 ${U(.4)} 0 ${LINE}` }}>
              Mulai tanpa layar penuh
            </Btn>
          </div>
          <p className="font-bold" style={{ fontSize: U(1), color: "#aaa" }}>← → geser · Spasi jeda/lanjut · F layar penuh</p>
          <button onClick={exit} aria-label="Keluar" className="top-4 left-4 absolute hover:bg-black/5 p-2.5 rounded-full text-[#afafaf]"><X size={26} /></button>
        </div>
      )}

      {started && (
        <>
          {/* ------- progres bersegmen + keluar ------- */}
          <div className="flex items-center" style={{ gap: U(1.2), padding: `${U(1.4)} ${U(2.4)} 0` }}>
            <button onClick={exit} aria-label="Keluar" className="hover:bg-black/5 p-1.5 rounded-full text-[#afafaf]"><X size={26} /></button>
            <div className="flex flex-1" style={{ gap: U(.5) }}>
              {Array.from({ length: N }).map((_, i) => (
                <button key={i} aria-label={`Bagian ${i + 1}`} onClick={() => go(i)} className="relative flex-1 rounded-full overflow-hidden" style={{ height: U(1.3), background: "#e5e5e5" }}>
                  <span className="top-0 left-0 absolute rounded-full h-full transition-[width] duration-100 ease-linear"
                    style={{ background: THEMES[i].c, width: i < idx ? "100%" : i === idx ? `${auto ? Math.max(prog, 0.04) * 100 : 100}%` : "0%" }}>
                    <span className="top-[22%] right-2 left-2 absolute bg-white/40 rounded-full h-[22%]" />
                  </span>
                </button>
              ))}
            </div>
            <span className="font-black tabular-nums" style={{ fontSize: U(1.2), color: MUTED }}>{idx + 1}/{N}</span>
          </div>

          {/* ------- panggung ------- */}
          <div className="flex-1 min-h-0" style={{ padding: `${U(1.6)} ${U(3.2)} ${U(1)}` }}>
            {slide && <div key={idx} className="h-full pres-in">{slide}</div>}
          </div>

          {/* klik tepi untuk geser */}
          <button aria-label="Sebelumnya" onClick={() => go(idx - 1)} className="top-[10vh] bottom-[26vh] left-0 z-20 absolute w-[5vw] cursor-w-resize" />
          <button aria-label="Berikutnya" onClick={() => go(idx + 1)} className="top-[10vh] right-0 bottom-[26vh] z-20 absolute w-[5vw] cursor-e-resize" />

          {/* ------- footer: maskot + gelembung + tombol ------- */}
          <div className="flex items-end" style={{ gap: U(1.2), padding: `${U(1)} ${U(3)} ${U(1.4)}`, borderTop: `2px solid ${LINE}`, background: theme.t, transition: "background .5s" }}>
            <div className="shrink-0"><BkMascot key={MOODS[idx]} mood={MOODS[idx]} size={mascotSize} /></div>
            <div className="relative flex-1 bg-white mb-[1.2vh] rounded-3xl" style={{ ...chunk(LINE, 5), padding: `${U(1.1)} ${U(1.6)}`, minHeight: U(7) }}>
              <span className="top-6 -left-[9px] absolute bg-white border-b-2 border-l-2 size-4 rotate-45" style={{ borderColor: LINE }} />
              <span className="inline-block mb-1 rounded-full font-black text-white uppercase tracking-wider" style={{ background: theme.c, fontSize: U(.85), padding: `${U(.15)} ${U(.8)}` }}>Kak Peci</span>
              <p className="font-extrabold leading-snug" style={{ fontSize: U(1.4), color: INK }}>
                {typed}<span className="pres-caret" style={{ color: theme.c }}>▍</span>
              </p>
            </div>
            <div className="flex items-center mb-[1.4vh] transition-opacity duration-500" style={{ gap: U(.8), opacity: active ? 1 : 0.25 }}>
              <button onClick={() => setAuto((v) => !v)} title={auto ? "Jeda" : "Putar otomatis"} aria-label="Jeda atau putar"
                className="pres-btn grid place-items-center bg-white rounded-2xl" style={{ width: U(4.2), height: U(4.2), ...chunk(LINE, 4), color: MUTED }}>
                {auto ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button onClick={toggleFull} title="Layar penuh (F)" aria-label="Layar penuh"
                className="pres-btn grid place-items-center bg-white rounded-2xl" style={{ width: U(4.2), height: U(4.2), ...chunk(LINE, 4), color: MUTED }}>
                {full ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
              <Btn outline onClick={() => go(idx - 1)}>Kembali</Btn>
              <Btn color={theme} onClick={() => go(idx + 1)}>{idx === N - 1 ? "Ulangi" : "Lanjut"}</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
