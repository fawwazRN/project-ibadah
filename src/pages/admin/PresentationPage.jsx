// Presentasi layar penuh untuk TV / laptop — dipandu maskot "Kak Peci".
// Ilustrasi ringan, aksen warna per bagian, dan tata letak yang rapi.
// Mode otomatis (geser tiap 20 detik) atau manual (← / → / klik / tombol).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Ban, BookOpenCheck, CalendarClock, CalendarDays, Flag, Footprints, HeartHandshake, History, Maximize, Medal,
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

// Accent colors are varied by section; cards and typography stay neutral.
const PAL = {
  green: { c: "#2f9e62", d: "#237a4a", t: "#eff8f2" },
  blue: { c: "#4a84bd", d: "#356b9e", t: "#eef5fb" },
  teal: { c: "#328f91", d: "#267173", t: "#edf7f6" },
  violet: { c: "#8264b2", d: "#684a96", t: "#f4f0f8" },
  orange: { c: "#c47a2c", d: "#9a5d1e", t: "#fbf4eb" },
};
const THEMES = [PAL.green, PAL.blue, PAL.teal, PAL.violet, PAL.orange, PAL.teal, PAL.green];
const CYCLE = [PAL.green, PAL.blue, PAL.teal, PAL.violet, PAL.orange];
const INK = "#3c3c3c";
const MUTED = "#777777";
const LINE = "#e5e5e5";

const CSS = `
@keyframes pres-in{from{opacity:0;transform:translateX(2%)}to{opacity:1;transform:none}}
@keyframes pres-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pres-caret{50%{opacity:0}}
.pres-in{animation:pres-in .35s ease-out both}
.pres-bar{transform-origin:left;animation:pres-grow 1.1s cubic-bezier(.22,1,.36,1) both}
.pres-caret{animation:pres-caret 1s steps(1) infinite}
.pres-btn{transition:background-color .15s,color .15s}
.pres-link{transition:background-color .15s}
.pres-link:hover{background:#1d6840!important}
@media (prefers-reduced-motion:reduce){.pres-in,.pres-bar{animation:none!important}}
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
const chunk = (color = LINE) => ({ border: `1px solid ${color}` });

function Heading({ theme, tag, title, sub, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-center" style={{ gap: U(1.2) }}>
      <span className="grid place-items-center rounded-2xl text-white shrink-0"
        style={{ width: U(4.6), height: U(4.6), background: theme.c }}>
        <Icon style={{ width: U(2.5), height: U(2.5) }} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <span className="inline-block font-bold uppercase tracking-wider"
          style={{ color: theme.d, fontSize: U(.85) }}>{tag}</span>
        <h1 className="font-extrabold tracking-tight leading-tight" style={{ fontSize: U(2.8), color: INK }}>{title}</h1>
        {sub && <p className="font-medium" style={{ fontSize: U(1.1), color: MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

function Empty({ text, theme }) {
  return (
    <div className="place-items-center grid rounded-2xl h-full font-bold text-center"
      style={{ ...chunk(LINE), background: "#f7faf8", color: theme.d, fontSize: U(1.7), padding: U(2) }}>
      {text}
    </div>
  );
}

const initials = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const Avatar = ({ name, i, size = 4.4 }) => (
  <span className="grid place-items-center rounded-full font-bold text-white shrink-0"
    style={{ width: U(size), height: U(size), fontSize: U(size * 0.38), background: CYCLE[i % CYCLE.length].c }}>
    {initials(name)}
  </span>
);

const RankBadge = ({ i }) =>
  i < 3 ? (
    <span style={{ fontSize: U(1.8), width: U(2.6), textAlign: "center" }}>{i + 1}</span>
  ) : (
    <span className="font-bold text-center" style={{ fontSize: U(1.5), width: U(2.6), color: MUTED }}>{i + 1}</span>
  );

// papan peringkat ala "liga"
function LeagueRows({ rows, theme, unit }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="grid h-full min-h-0 gap-[0.7vh]" style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}>
      {rows.map((r, i) => (
        <div key={r.key} className="relative flex min-h-0 items-center overflow-hidden bg-white rounded-2xl"
          style={{
            ...chunk(i === 0 ? theme.c : LINE), background: i === 0 ? theme.t : "#fff",
            gap: U(.8), padding: `${U(.3)} ${U(1)}`,
          }}>
          <RankBadge i={i} />
          <Avatar name={r.name} i={i} size={3.1} />
          <div className="min-w-0 shrink-0" style={{ width: U(16) }}>
            <p className="font-bold truncate" style={{ fontSize: U(1.5), color: INK }}>
              {r.name}
            </p>
            <p className="font-medium truncate" style={{ fontSize: U(.9), color: MUTED }}>{r.sub}</p>
          </div>
          <div className="relative flex-1 rounded-full overflow-hidden" style={{ height: U(.8), background: "#edf1ee" }}>
            <div className="relative rounded-full h-full pres-bar"
              style={{ width: `${Math.max(7, (r.value / max) * 100)}%`, background: theme.c, animationDelay: `${0.3 + i * 0.12}s` }}>
              <span className="top-[22%] right-3 left-3 absolute bg-white/40 rounded-full h-[22%]" />
            </div>
          </div>
          <p className="font-bold tabular-nums text-right" style={{ minWidth: U(7), fontSize: U(1.8), color: theme.d }}>
            <CountUp to={r.value} /> <span style={{ fontSize: U(.85), color: MUTED }}>{unit}</span>
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
    <div className="flex flex-col h-full min-h-0" style={{ gap: U(.9) }}>
      <Heading theme={theme} icon={Flag} tag="Top 5 · Qism Ibadah" title="Pelanggar Ibadah Bulan Ini" sub="Berdasarkan poin pelanggaran bulan berjalan" />
      <div className="flex-1 min-h-0 overflow-hidden">
        {rows.length ? <LeagueRows rows={rows} theme={theme} unit="poin" />
          : <Empty theme={PAL.green} text="Alhamdulillah, belum ada pelanggaran bulan ini." />}
      </div>
    </div>
  );
}

function SlideFutsal({ data, theme }) {
  const { ctx, teams, players } = data.league;
  const Panel = ({ color, icon: Icon, title, children }) => (
    <div className="flex flex-col bg-white rounded-2xl min-h-0 overflow-hidden" style={chunk(LINE)}>
      <div className="flex items-center font-bold" style={{ background: color.t, color: INK, gap: U(.8), fontSize: U(1.4), padding: `${U(.7)} ${U(1.2)}` }}>
        <Icon style={{ width: U(1.8), height: U(1.8), color: color.c }} strokeWidth={2.2} /> {title}
      </div>
      <div className="flex flex-col flex-1 min-h-0 justify-evenly gap-[.5vh] overflow-hidden" style={{ padding: U(1) }}>{children}</div>
    </div>
  );
  const Row = ({ i, name, sub, value, max, unit, color }) => (
    <div className="flex min-h-0 items-center" style={{ gap: U(.8) }}>
      <RankBadge i={i} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline" style={{ gap: U(1) }}>
          <p className="font-bold truncate" style={{ fontSize: U(1.3), color: INK }}>{name}</p>
          <span className="font-bold tabular-nums" style={{ fontSize: U(1.5), color: color.d }}>
            <CountUp to={value} /> <small style={{ fontSize: U(.9), color: MUTED }}>{unit}</small>
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: U(.65), background: "#edf1ee" }}>
          <div className="rounded-full h-full pres-bar" style={{ width: `${Math.max(8, (value / max) * 100)}%`, background: color.c, animationDelay: `${0.3 + i * 0.1}s` }} />
        </div>
        <p className="font-medium truncate" style={{ fontSize: U(.85), color: MUTED }}>{sub}</p>
      </div>
    </div>
  );
  const maxP = Math.max(...teams.map((t) => t.points), 1);
  const maxG = Math.max(...players.map((p) => p.goals), 1);
  return (
    <div className="flex flex-col h-full min-h-0" style={{ gap: U(.9) }}>
      <Heading theme={theme} icon={Volleyball} tag="Top 5 · Qism Riyadhah" title="Pemain & Tim Futsal Terbaik"
        sub={ctx ? `${ctx.phase_name} · ${ctx.season_name} — hanya laga resmi` : "Liga futsal OSIS"} />
      <div className="gap-[1.4vw] grid grid-cols-2 flex-1 min-h-0">
        <Panel color={PAL.blue} icon={Trophy} title="Klasemen Tim">
          {teams.length ? teams.map((t, i) => <Row key={t.team_id} i={i} name={t.name} sub={`${t.played} laga · SG ${t.gd > 0 ? "+" : ""}${t.gd}`} value={t.points} max={maxP} unit="poin" color={PAL.blue} />)
            : <p className="font-bold" style={{ color: MUTED }}>Belum ada klasemen</p>}
        </Panel>
        <Panel color={PAL.teal} icon={Target} title="Top Skor Pemain">
          {players.length ? players.map((p, i) => <Row key={p.student_id ?? p.full_name} i={i} name={p.full_name} sub={`${p.team_name ?? "—"} · ${p.appearances} laga`} value={p.goals} max={maxG} unit="gol" color={PAL.teal} />)
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
    <div className="flex flex-col h-full min-h-0" style={{ gap: U(.9) }}>
      <Heading theme={theme} icon={Footprints} tag="Top 5 · Nadzhofah" title="Pelanggar Kebersihan & Kerapian" sub="Gabungan nyeker + baju disita (lelang tidak dihitung)" />
      <div className="flex-1 min-h-0 overflow-hidden">
        {rows.length ? <LeagueRows rows={rows} theme={theme} unit="poin" />
          : <Empty theme={PAL.green} text="Semua santri rapi dan bersih. Luar biasa!" />}
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
  const moods = ["talk", "read", "care", "think", "wave", "idle"];
  const vh = useViewportH();
  const mascotSize = Math.round(Math.min(vh * 0.14, 100));
  return (
    <div className="flex flex-col h-full min-h-0" style={{ gap: U(.9) }}>
      <Heading theme={theme} icon={Users} tag={`Fitur web · Bagian ${f.part} dari 3`} title={f.title} sub={f.sub} />
      <div className="gap-[1.2vw] grid grid-cols-3 grid-rows-2 flex-1 min-h-0">
        {f.items.map(([Icon, name, desc], i) => {
          const c = CYCLE[(i + f.part) % CYCLE.length];
          return (
            <div key={name} className="flex min-h-0 flex-col overflow-hidden bg-white rounded-2xl"
              style={{ ...chunk(LINE) }}>
              <div aria-hidden="true" className="relative flex flex-1 min-h-0 items-end justify-center overflow-hidden"
                style={{ minHeight: U(7.5), background: c.t }}>
                <span className="top-[-35%] left-[8%] absolute rounded-full opacity-50"
                  style={{ width: U(9), height: U(9), background: "#fff" }} />
                <span className="top-[20%] right-[13%] absolute rounded-full opacity-60"
                  style={{ width: U(1.1), height: U(1.1), background: c.c }} />
                <span className="top-[34%] left-[28%] absolute rounded-full opacity-40"
                  style={{ width: U(.65), height: U(.65), background: c.d }} />
                <div className="right-[18%] bottom-[17%] absolute z-10 grid place-items-center rounded-2xl bg-white"
                  style={{ width: U(5.8), height: U(5.8), color: c.d, border: `1px solid ${c.c}30`, transform: "rotate(5deg)", boxShadow: "0 8px 18px -14px rgba(30,50,40,.5)" }}>
                  <Icon style={{ width: U(3.1), height: U(3.1) }} strokeWidth={1.8} />
                </div>
                <div className="left-[18%] bottom-[-5%] absolute z-20">
                  <BkMascot mood={moods[i]} size={mascotSize} />
                </div>
              </div>
              <div className="min-h-0" style={{ padding: `${U(.65)} ${U(.9)} ${U(.75)}` }}>
                <p className="font-bold leading-tight" style={{ fontSize: U(1.35), color: INK }}>{name}</p>
                <p className="mt-1 line-clamp-2 font-medium leading-snug" style={{ fontSize: U(.9), color: MUTED }}>{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideEnd() {
  const vh = useViewportH();
  const mascotSize = Math.round(Math.min(vh * 0.24, 180));
  return (
    <div className="grid h-full min-h-0 grid-cols-2 items-center overflow-hidden" style={{ gap: U(2), padding: `0 ${U(2)}` }}>
      <div className="relative flex h-full min-h-0 items-end justify-center overflow-hidden rounded-3xl"
        style={{ background: PAL.green.t, border: `1px solid ${PAL.green.c}30` }}>
        <span className="top-[-18%] left-[-6%] absolute rounded-full opacity-70"
          style={{ width: U(19), height: U(19), background: "#fff" }} />
        <div className="top-[16%] right-[9%] absolute z-10 rounded-2xl bg-white p-2"
          style={{ width: "68%", height: "56%", border: `1px solid ${LINE}`, transform: "rotate(3deg)", boxShadow: "0 16px 30px -24px rgba(30,50,40,.45)" }}>
          <div className="flex items-center gap-1.5 border-b border-[#e8eee9] pb-2">
            <span className="size-2 rounded-full bg-[#d7e6dc]" />
            <span className="size-2 rounded-full bg-[#d7e6dc]" />
            <span className="size-2 rounded-full bg-[#d7e6dc]" />
            <span className="ml-2 h-2 flex-1 rounded-full bg-[#f0f4f1]" />
          </div>
          <div className="mt-2 grid h-[78%] grid-cols-[.65fr_1fr] gap-2">
            <div className="rounded-lg" style={{ background: PAL.green.t }} />
            <div className="flex flex-col gap-2">
              <div className="h-2 w-3/4 rounded-full bg-[#dce9df]" />
              <div className="h-2 w-1/2 rounded-full bg-[#edf2ee]" />
              <div className="mt-auto rounded-lg" style={{ height: "55%", background: PAL.blue.t }} />
            </div>
          </div>
        </div>
        <div className="bottom-[-3%] left-[5%] absolute z-20">
          <BkMascot mood="wave" size={mascotSize} />
        </div>
        <div className="bottom-[18%] left-[39%] absolute z-30 rounded-2xl bg-white font-semibold"
          style={{ padding: `${U(.7)} ${U(1)}`, color: PAL.green.d, fontSize: U(1.05), border: `1px solid ${LINE}` }}>
          Yuk, kita coba!
        </div>
      </div>
      <div className="flex min-w-0 flex-col justify-center" style={{ gap: U(1.1) }}>
        <div>
          <p className="font-bold uppercase tracking-widest" style={{ color: PAL.green.d, fontSize: U(.9) }}>Penutup</p>
          <h1 className="font-extrabold tracking-tight leading-tight" style={{ fontSize: U(3.1), color: INK }}>Sekarang giliran teman-teman.</h1>
          <p className="mt-2 font-medium leading-relaxed" style={{ fontSize: U(1.15), color: MUTED }}>
            Kalau penasaran, mari lihat langsung fitur web OSIS. Buka alamat ini di HP atau perangkat di depan.
          </p>
        </div>
        <a href={`https://${SITE_LABEL}`} target="_blank" rel="noopener noreferrer"
          className="pres-link flex max-w-full items-center justify-between rounded-2xl"
          style={{ gap: U(1), padding: `${U(1)} ${U(1.4)}`, background: PAL.green.d, color: "#fff", textDecoration: "none" }}>
          <span className="min-w-0">
            <span className="block font-medium" style={{ fontSize: U(.9), opacity: .9 }}>Kunjungi website OSIS</span>
            <span className="block break-all font-extrabold" style={{ fontSize: U(2.1) }}>{SITE_LABEL}</span>
          </span>
          <ArrowUpRight className="shrink-0" style={{ width: U(2), height: U(2) }} />
        </a>
        <p className="font-medium" style={{ fontSize: U(.95), color: MUTED }}>Terima kasih sudah menyimak. Silakan dicoba bersama!</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- narasi maskot
function narration(i, d) {
  const top = d.ibadah[0], pl = d.league.players[0], tm = d.league.teams[0];
  return [
    `Assalamu'alaikum, aku Kak Peci! Yuk lihat 5 santri dengan poin pelanggaran ibadah tertinggi bulan ini${top ? `, tertinggi ${top.score} poin` : ""}. Kita saling mengingatkan ya!`,
    `Sekarang kita lihat hasil futsal. ${tm ? `Tim ${tm.name} memimpin klasemen. ` : ""}${pl ? `Top skor: ${pl.full_name} dengan ${pl.goals} gol.` : "Belum ada gol yang tercatat."}`,
    "Nadzhofah itu tentang kebersihan dan kerapian. Ini 5 santri dengan poin nyeker dan baju disita terbanyak. Semangat memperbaiki diri!",
    "Sekarang kenalan dengan fitur web ini. Bagian pertama: teman curhat, artikel, catatan pribadi, kalender, dan laporan untuk santri.",
    "Bagian kedua! Tiap qism punya ruang kerja sendiri: liga futsal, papan peringkat, nadzhofah, lughah, zikir, sampai kartu dan suspensi.",
    "Bagian ketiga: aturan poin otomatis, rekap siap cetak, log audit, pembagian akses, undangan digital, dan bisa dipasang di HP.",
    `Teman-teman, kalau penasaran, yuk buka ${SITE_LABEL} dari HP masing-masing atau kita coba bersama. Terima kasih sudah menyimak!`,
  ][i];
}
const MOODS = ["care", "cheer", "think", "wave", "talk", "read", "wave"];

function Btn({ color = PAL.green, outline = false, children, style, ...p }) {
  return (
    <button {...p} className="pres-btn rounded-xl font-bold"
      style={{
        fontSize: U(1.2), padding: `${U(.8)} ${U(1.8)}`,
        background: outline ? "#fff" : color.c, color: outline ? INK : "#fff",
        border: `1px solid ${outline ? LINE : color.c}`,
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

  const mascotSize = Math.round(Math.min(vh * 0.13, 105));

  return (
    <div className="z-[300] fixed inset-0 flex flex-col bg-white overflow-hidden font-sans select-none"
      style={{ "--u": "min(1vw, 1.78vh)", color: INK, cursor: active ? "default" : "none" }}>
      <style>{CSS}</style>

      {/* ------- layar mulai ------- */}
      {!started && (
        <div className="z-30 absolute inset-0 flex flex-col justify-center items-center bg-white text-center" style={{ gap: U(1.4) }}>
          <div className="flex items-end" style={{ gap: U(1) }}>
            <BkMascot mood="wave" size={Math.round(Math.min(vh * 0.2, 145))} />
            <div className="relative bg-white mb-[2vh] rounded-2xl font-semibold" style={{ ...chunk(LINE), fontSize: U(1.3), padding: `${U(.8)} ${U(1.2)}` }}>
              Yuk mulai!
            </div>
          </div>
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: U(4), color: PAL.green.d }}>Presentasi OSIS</h1>
          <p className="font-medium" style={{ fontSize: U(1.3), color: MUTED }}>Kenalan dengan fitur web OSIS bersama Kak Peci</p>
          <div className="flex flex-col items-center" style={{ gap: U(.8), width: U(28) }}>
            <Btn onClick={() => start(true)} disabled={!data} style={{ width: "100%", opacity: data ? 1 : 0.6 }}>
              {data ? "Mulai (layar penuh)" : "Menyiapkan data…"}
            </Btn>
            <Btn outline onClick={() => start(false)} disabled={!data} style={{ width: "100%" }}>
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
          <div className="flex shrink-0 items-center" style={{ gap: U(1.2), padding: `${U(1)} ${U(2.4)} 0` }}>
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
          <div className="flex-1 min-h-0 overflow-hidden" style={{ padding: `${U(1.2)} ${U(3.2)} ${U(.8)}` }}>
            {slide && <div key={idx} className="h-full pres-in">{slide}</div>}
          </div>

          {/* klik tepi untuk geser */}
          <button aria-label="Sebelumnya" onClick={() => go(idx - 1)} className="top-[10vh] bottom-[26vh] left-0 z-20 absolute w-[5vw] cursor-w-resize" />
          <button aria-label="Berikutnya" onClick={() => go(idx + 1)} className="top-[10vh] right-0 bottom-[26vh] z-20 absolute w-[5vw] cursor-e-resize" />

          {/* ------- footer: maskot + gelembung + tombol ------- */}
          <div className="flex shrink-0 items-end" style={{ gap: U(1), padding: `${U(.8)} ${U(3)} ${U(1)}`, borderTop: `1px solid ${LINE}`, background: theme.t }}>
            <div className="shrink-0"><BkMascot key={MOODS[idx]} mood={MOODS[idx]} size={mascotSize} /></div>
            <div className="relative min-w-0 flex-1 bg-white rounded-2xl" style={{ ...chunk(LINE), padding: `${U(.8)} ${U(1.2)}` }}>
              <span className="inline-block mb-1 font-semibold" style={{ color: theme.d, fontSize: U(.85) }}>Kak Peci</span>
              <p className="font-semibold leading-snug" style={{ fontSize: U(1.1), color: INK }}>
                {typed}<span className="pres-caret" style={{ color: theme.c }}>▍</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center transition-opacity duration-500" style={{ gap: U(.6), opacity: active ? 1 : 0.25 }}>
              <button onClick={() => setAuto((v) => !v)} title={auto ? "Jeda" : "Putar otomatis"} aria-label="Jeda atau putar"
                className="pres-btn grid place-items-center bg-white rounded-xl" style={{ width: U(3.5), height: U(3.5), ...chunk(LINE), color: MUTED }}>
                {auto ? <Pause size={22} /> : <Play size={22} />}
              </button>
              <button onClick={toggleFull} title="Layar penuh (F)" aria-label="Layar penuh"
                className="pres-btn grid place-items-center bg-white rounded-xl" style={{ width: U(3.5), height: U(3.5), ...chunk(LINE), color: MUTED }}>
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
