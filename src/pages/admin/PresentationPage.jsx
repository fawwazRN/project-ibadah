// Presentasi layar penuh untuk TV / laptop — dipandu maskot "Kak Peci".
// 13 slide: ibadah, riyadhah, nadzhofah, lughah, fitur web, ajakan kunjungi web.
// Daftar panjang (aturan, jadwal, pelanggar) bergulir otomatis; slide baru
// berpindah setelah gulir selesai. ← / → / Spasi / F / klik tepi layar.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowUpRight, Ban, BookOpenCheck, CalendarClock, CalendarDays, Crown, Flag, Footprints, HeartHandshake, History,
  Languages, Maximize, Medal, MessageSquareWarning, MessagesSquare, Minimize, Newspaper, Pause, Play, Printer,
  Scale, ShieldCheck, Shirt, Smartphone, Sparkles, Sunrise, Sunset, Target, Trophy, Users, Volleyball, X,
} from "lucide-react";
import { BkMascot } from "../../components/ui/BkMascot";
import { leaderboardService } from "../../services/leaderboardService";
import { nyekerService } from "../../services/nyekerService";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { ruleService } from "../../services/ruleService";
import { zikirService } from "../../services/zikirService";
import { violationService } from "../../services/violationService";
import { lughahService } from "../../services/lughahService";
import { computeStandings } from "../../utils/standings";
import { startOfWeek, endOfWeek } from "../../lib/date";
import { readPresentationVocabOverride } from "../../lib/lughah";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { isPresentationEmail } from "../../lib/constants";

const SLIDE_MS = 14000; // minimum per slide; slide dengan gulir menunggu gulir selesai
const RESUME_KEY = "pres-resume";
const SITE_LABEL = "project-osis.vercel.app";
const U = (n) => `calc(var(--u) * ${n})`; // 1u ≈ 1% lebar layar (dibatasi tinggi layar)

const PAL = {
  green: { c: "#58cc02", d: "#3f9a00", t: "#eefbe2", s: "#46a302" },
  blue: { c: "#1cb0f6", d: "#1487bd", t: "#e5f6fe", s: "#1899d6" },
  teal: { c: "#00cd9c", d: "#009c78", t: "#e0faf3", s: "#00a67e" },
  violet: { c: "#a56cff", d: "#7d44d4", t: "#f1e8ff", s: "#8549ba" },
  orange: { c: "#ff9600", d: "#c97300", t: "#fff1db", s: "#d57d00" },
  red: { c: "#ef4444", d: "#b91c1c", t: "#fff0f0", s: "#c92f2f" },
  rose: { c: "#ff5a7a", d: "#cc3a58", t: "#ffe8ed", s: "#d1405f" },
};
const CYCLE = [PAL.green, PAL.blue, PAL.violet, PAL.orange, PAL.teal];
const INK = "#3c3c3c";
const MUTED = "#777777";
const LINE = "#e5e5e5";
const MEDAL = ["#ffc800", "#b8c0cc", "#e08a4a"];

const CSS = `
@keyframes pres-in{from{opacity:0;transform:translateX(3%)}to{opacity:1;transform:none}}
@keyframes pres-pop{0%{opacity:0;transform:translateY(14px) scale(.92)}100%{opacity:1;transform:none}}
@keyframes pres-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes pres-caret{50%{opacity:0}}
@keyframes pres-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
.pres-in{animation:pres-in .4s ease-out both}
.pres-pop{animation:pres-pop .5s cubic-bezier(.34,1.56,.64,1) both;animation-delay:var(--d,0s)}
.pres-bar{transform-origin:left;animation:pres-grow 1.1s cubic-bezier(.22,1,.36,1) both}
.pres-caret{animation:pres-caret 1s steps(1) infinite}
.pres-float{animation:pres-float 7s ease-in-out infinite}
.pres-btn{transition:transform .1s,filter .15s}
.pres-btn:active{transform:translateY(2px)}
.pres-cols{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,auto)}
.pres-panels{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:minmax(0,1fr)}
@media (max-aspect-ratio:5/4){.pres-cols,.pres-panels{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.pres-in,.pres-pop,.pres-bar,.pres-float{animation:none!important}}
`;

// kartu "chunky" ala Duolingo: border tebal + dasar lebih gelap
const edge = (color, shade) => ({
  borderStyle: "solid", borderWidth: `2px 2px ${U(.35)} 2px`, borderColor: `${color} ${color} ${shade} ${color}`,
});
const chunk = (c = LINE) => edge(c, "#d4d4d4");
const card3d = (color = LINE, shade = "#d4d4d4", bg = "#fff") => ({ background: bg, ...edge(color, shade), borderRadius: U(1.5) });

// ---------------------------------------------------------------- hooks
function useTypewriter(text, speed = 22) {
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

// Gulir otomatis: jeda 2 dtk → gulir pelan sampai ujung → jeda. Melapor durasi
// yang dibutuhkan agar slide tidak pindah sebelum semua isi terbaca.
const NeedCtx = createContext(null);
function AutoScroll({ children, speed = 3.2 }) {
  const box = useRef(null);
  const first = useRef(null);
  const id = useId();
  const need = useContext(NeedCtx);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const el = box.current, a = first.current;
    if (!el || !a) return;
    let raf, h = 0, pps = 60;
    const t0 = performance.now();
    const measure = () => {
      const unit = Math.min(window.innerWidth / 100, (window.innerHeight * 1.78) / 100);
      pps = Math.max(24, speed * unit);
      h = a.offsetHeight;
      const o = h > el.clientHeight + 4;
      setOver(o);
      need?.set(id, o ? 1500 + (h / pps) * 1000 + 800 : 0); // satu putaran penuh
    };
    const tick = (t) => {
      el.scrollTop = h > el.clientHeight + 4 ? (Math.max(0, t - t0 - 1500) / 1000 * pps) % h : 0;
      raf = requestAnimationFrame(tick);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el); ro.observe(a);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); need?.set(id, 0); };
  }, [speed, id, need]);
  const mask = "linear-gradient(transparent, #000 3%, #000 93%, transparent)";
  return (
    <div ref={box} className="h-full overflow-hidden" style={over ? { WebkitMaskImage: mask, maskImage: mask } : undefined}>
      <div ref={first}>{children}</div>
      {over && <div aria-hidden="true">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- data
const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
const fmtWhen = (iso) => new Date(iso).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function loadData() {
  const wkStart = startOfWeek();
  const vocabOverride = readPresentationVocabOverride();
  const [ibadah, nadz, league, rules, zikir, weekly, vocab] = await Promise.allSettled([
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
      const upcoming = (matches ?? [])
        .filter((m) => m.status === "scheduled")
        .sort((a, b) => (a.scheduled_at ? +new Date(a.scheduled_at) : 9e15) - (b.scheduled_at ? +new Date(b.scheduled_at) : 9e15) || (a.week ?? 0) - (b.week ?? 0))
        .slice(0, 10);
      return {
        ctx, upcoming,
        teams: computeStandings(teams, official, settings.tiebreak_order).slice(0, 5),
        players: (players ?? [])
          .filter((p) => p.goals > 0)
          .sort((a, b) => b.goals - a.goals || a.yellow - b.yellow || a.full_name.localeCompare(b.full_name))
          .slice(0, 5),
      };
    })(),
    ruleService.list({ activeOnly: true }),
    zikirService.list({ from: isoDay() }),
    violationService.list({ from: wkStart }),
    vocabOverride ? Promise.resolve(vocabOverride) : lughahService.dailyVocab(3),
  ]);
  const ok = (r, fb) => (r.status === "fulfilled" && r.value ? r.value : fb);
  const nz = ok(nadz, []);
  const top = (key) => [...nz].filter((r) => (r[key] ?? 0) > 0).sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0)).slice(0, 5);

  // pelanggar riyadhah pekan ini (Jumat–Kamis), digabung per santri
  const agg = new Map();
  ok(weekly, []).filter((v) => v.rule?.scope === "riyadhah" && v.status !== "revoked").forEach((v) => {
    const k = v.santri?.id ?? v.santri_id;
    const a = agg.get(k) ?? { key: k, name: v.santri?.full_name ?? "—", cls: v.santri?.class_name, count: 0, pts: 0, rules: new Set() };
    a.count += 1; a.pts += v.rule?.points ?? 0; a.rules.add(v.rule?.name);
    agg.set(k, a);
  });
  const allRules = ok(rules, []);
  const pres = await supabase.rpc("get_presentation_settings").then((r) => r.data?.[0] ?? null).catch(() => null);
  return {
    ibadah: ok(ibadah, []).slice(0, 5),
    nyeker: top("nyeker_count"),
    clothing: top("clothing_count"),
    league: ok(league, { ctx: null, teams: [], players: [], upcoming: [] }),
    rulesIbadah: allRules.filter((r) => (r.scope ?? "ibadah") === "ibadah"),
    rulesRiyadhah: allRules.filter((r) => r.scope === "riyadhah"),
    zikir: ok(zikir, []).slice(0, 16),
    weekly: [...agg.values()].sort((a, b) => b.pts - a.pts || b.count - a.count),
    weekRange: `${fmtDay(isoDay(wkStart))} – ${fmtDay(isoDay(endOfWeek()))}`,
    vocab: vocabOverride ?? ok(vocab, []),
    link: pres?.link_url ? { raw: pres.link_url, url: toEmbed(pres.link_url), secs: pres.link_secs || 120 } : null,
  };
}

// ---------------------------------------------------------------- komponen dasar
function Heading({ theme, tag, title, sub, icon: Icon }) {
  return (
    <div className="flex min-w-0 items-center" style={{ gap: U(1.3) }}>
      <span className="grid place-items-center text-white shrink-0"
        style={{ width: U(5), height: U(5), background: theme.c, borderRadius: U(1.5), boxShadow: `0 ${U(.35)} 0 ${theme.s}` }}>
        <Icon style={{ width: U(2.7), height: U(2.7) }} strokeWidth={2.4} />
      </span>
      <div className="min-w-0">
        <span className="inline-block font-extrabold uppercase tracking-wider" style={{ color: theme.d, fontSize: U(.9) }}>{tag}</span>
        <h1 className="font-black tracking-tight leading-tight truncate" style={{ fontSize: U(3), color: INK }}>{title}</h1>
        {sub && <p className="font-semibold truncate" style={{ fontSize: U(1.1), color: MUTED }}>{sub}</p>}
      </div>
    </div>
  );
}

function Empty({ text, theme }) {
  return (
    <div className="place-items-center grid h-full font-extrabold text-center"
      style={{ ...card3d(theme.c, theme.s, theme.t), color: theme.d, fontSize: U(1.9), padding: U(2) }}>
      {text}
    </div>
  );
}

const initials = (n = "") => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const Avatar = ({ name, i, size = 4.4, color }) => (
  <span className="grid place-items-center rounded-full font-extrabold text-white shrink-0"
    style={{ width: U(size), height: U(size), fontSize: U(size * 0.38), background: color ?? CYCLE[i % CYCLE.length].c }}>
    {initials(name)}
  </span>
);

const RankBadge = ({ i, bad, theme }) => (
  <span className="grid place-items-center rounded-full font-black shrink-0"
    style={bad
      ? { width: U(2.9), height: U(2.9), fontSize: U(1.4), background: i < 3 ? theme.c : "#eceaea", color: i < 3 ? "#fff" : MUTED }
      : { width: U(2.9), height: U(2.9), fontSize: U(1.4), background: i < 3 ? MEDAL[i] : "#eee", color: i < 3 ? "#fff" : MUTED }}>
    {!bad && i === 0 ? <Crown style={{ width: U(1.7), height: U(1.7) }} strokeWidth={2.6} /> : i + 1}
  </span>
);

// baris peringkat. fixed = tinggi tetap (untuk daftar yang digulir)
function LeagueRows({ rows, theme, unit, fixed, bad, nameW = 15 }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const wrap = fixed
    ? { display: "flex", flexDirection: "column", gap: U(.7) }
    : { display: "grid", gap: U(.7), height: "100%", gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` };
  return (
    <div style={wrap}>
      {rows.map((r, i) => (
        <div key={r.key} className="pres-pop relative flex items-center overflow-hidden min-h-0"
          style={{ ...card3d(i === 0 ? theme.c : LINE, i === 0 ? theme.s : "#d4d4d4", i === 0 ? theme.t : "#fff"),
            gap: U(.9), padding: `${U(.3)} ${U(1.1)}`, "--d": `${i * 0.08}s`, ...(fixed ? { height: U(5.6), flexShrink: 0 } : {}) }}>
          <RankBadge i={i} bad={bad} theme={theme} />
          {bad ? <Avatar name={r.name} i={i} size={3.2} color={i === 0 ? theme.d : "#6b7280"} /> : <Avatar name={r.name} i={i} size={3.2} />}
          <div className="min-w-0 shrink-0" style={{ width: U(nameW) }}>
            <p className="font-extrabold truncate" style={{ fontSize: U(1.5), color: INK }}>{r.name}</p>
            <p className="font-semibold truncate" style={{ fontSize: U(.9), color: MUTED }}>{r.sub}</p>
          </div>
          <div className="relative flex-1 rounded-full overflow-hidden" style={{ height: U(1), background: "#eef0ee" }}>
            <div className="relative rounded-full h-full pres-bar"
              style={{ width: `${Math.max(7, (r.value / max) * 100)}%`, background: theme.c, animationDelay: `${0.3 + i * 0.1}s` }}>
              <span className="top-[22%] right-3 left-3 absolute bg-white/40 rounded-full h-[22%]" />
            </div>
          </div>
          <p className="font-black tabular-nums text-right" style={{ minWidth: U(7), fontSize: U(1.9), color: theme.d }}>
            <CountUp to={r.value} /> <span style={{ fontSize: U(.9), color: MUTED }}>{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function Panel({ color, icon: Icon, title, children }) {
  return (
    <div className="flex flex-col min-h-0 overflow-hidden" style={card3d(LINE, "#d4d4d4")}>
      <div className="flex items-center font-extrabold shrink-0"
        style={{ background: color.t, color: INK, gap: U(.8), fontSize: U(1.45), padding: `${U(.7)} ${U(1.2)}` }}>
        <Icon style={{ width: U(1.9), height: U(1.9), color: color.c }} strokeWidth={2.4} /> {title}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ padding: U(.9) }}>{children}</div>
    </div>
  );
}

const SlideShell = ({ children }) => <div className="flex flex-col h-full min-h-0" style={{ gap: U(1) }}>{children}</div>;
const Body = ({ children }) => <div className="flex-1 min-h-0 overflow-hidden">{children}</div>;
const Pill = ({ theme, children }) => (
  <span className="inline-flex items-center rounded-full font-black shrink-0"
    style={{ background: theme.t, color: theme.d, fontSize: U(1), padding: `${U(.25)} ${U(.8)}`, border: `2px solid ${theme.c}55` }}>{children}</span>
);

// ---------------------------------------------------------------- slide
function SlideIbadahTop({ data, theme }) {
  const rows = data.ibadah.map((r) => ({
    key: r.santri_id ?? r.student_id ?? r.full_name, name: r.full_name,
    sub: `Kelas ${r.class_name ?? "—"} · ${r.violation_count ?? 0} pelanggaran`, value: r.score ?? 0,
  }));
  return (
    <SlideShell>
      <Heading theme={theme} icon={AlertTriangle} tag="Qism Ibadah · Top 5" title="Pelanggar Ibadah Bulan Ini" sub="Poin pelanggaran bulan berjalan — ayo berbenah, jangan diulangi" />
      <Body>{rows.length ? <LeagueRows rows={rows} theme={theme} unit="poin" bad /> : <Empty theme={PAL.green} text="Alhamdulillah, belum ada pelanggaran bulan ini." />}</Body>
    </SlideShell>
  );
}

function SlideRules({ rules, theme, icon, tag, title, sub }) {
  const groups = useMemo(() => {
    const m = new Map();
    rules.forEach((r) => m.set(r.category ?? "Umum", [...(m.get(r.category ?? "Umum") ?? []), r]));
    return [...m.entries()];
  }, [rules]);
  let n = 0;
  return (
    <SlideShell>
      <Heading theme={theme} icon={icon} tag={tag} title={title} sub={sub} />
      <Body>
        {rules.length ? (
          <AutoScroll>
            <div style={{ display: "flex", flexDirection: "column", gap: U(1.1), paddingBottom: U(2) }}>
              {groups.map(([cat, list]) => (
                <div key={cat}>
                  <p className="font-black uppercase tracking-wider" style={{ color: theme.d, fontSize: U(1.1), marginBottom: U(.5) }}>{cat}</p>
                  <div className="pres-cols" style={{ gap: U(.8) }}>
                    {list.map((r) => (
                      <div key={r.id} className="pres-pop flex items-center" style={{ ...card3d(LINE, "#d4d4d4"), gap: U(.9), padding: `${U(.7)} ${U(1)}`, "--d": `${(n++ % 8) * 0.05}s` }}>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold leading-snug" style={{ fontSize: U(1.3), color: INK }}>{r.name}</p>
                          {r.description && <p className="font-semibold line-clamp-2 leading-snug" style={{ fontSize: U(.95), color: MUTED }}>{r.description}</p>}
                        </div>
                        <Pill theme={theme}>{r.points} poin</Pill>
                        {r.creates_suspension && <Pill theme={PAL.rose}>Skors {r.suspension_weeks} pekan</Pill>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </AutoScroll>
        ) : <Empty theme={theme} text="Belum ada aturan aktif." />}
      </Body>
    </SlideShell>
  );
}

function SlideZikir({ data, theme }) {
  return (
    <SlideShell>
      <Heading theme={theme} icon={CalendarClock} tag="Qism Ibadah · Jadwal" title="Jadwal Zikir" sub="Petugas imam zikir yang akan datang" />
      <Body>
        {data.zikir.length ? (
          <AutoScroll>
            <div className="pres-cols" style={{ gap: U(.9), paddingBottom: U(2) }}>
              {data.zikir.map((s, i) => {
                const pagi = s.session_type === "pagi";
                const c = pagi ? PAL.orange : PAL.violet;
                const Ic = pagi ? Sunrise : Sunset;
                return (
                  <div key={s.id ?? i} className="pres-pop flex items-center" style={{ ...card3d(LINE, "#d4d4d4"), gap: U(1), padding: U(.9), "--d": `${(i % 8) * 0.05}s` }}>
                    <span className="grid place-items-center text-white shrink-0" style={{ width: U(4.6), height: U(4.6), background: c.c, borderRadius: U(1.3), boxShadow: `0 ${U(.3)} 0 ${c.s}` }}>
                      <Ic style={{ width: U(2.6), height: U(2.6) }} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold truncate" style={{ fontSize: U(1.35), color: INK }}>{fmtDay(s.session_date)}</p>
                      <p className="font-bold truncate" style={{ fontSize: U(1.05), color: c.d }}>
                        Zikir {pagi ? "Pagi" : "Petang"} · {String(s.time_start ?? "").slice(0, 5)} WIB{s.location ? ` · ${s.location}` : ""}
                      </p>
                      <p className="font-semibold truncate" style={{ fontSize: U(1), color: MUTED }}>
                        Imam: {s.leader_name ?? "belum ditentukan"}{s.leader_class ? ` (${s.leader_class})` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </AutoScroll>
        ) : <Empty theme={theme} text="Belum ada jadwal zikir." />}
      </Body>
    </SlideShell>
  );
}

function LigaRow({ i, name, sub, value, max, unit, color }) {
  return (
    <div className="pres-pop flex min-h-0 items-center" style={{ gap: U(.8), "--d": `${i * 0.08}s` }}>
      <RankBadge i={i} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline" style={{ gap: U(1) }}>
          <p className="font-extrabold truncate" style={{ fontSize: U(1.35), color: INK }}>{name}</p>
          <span className="font-black tabular-nums" style={{ fontSize: U(1.6), color: color.d }}>
            <CountUp to={value} /> <small style={{ fontSize: U(.9), color: MUTED }}>{unit}</small>
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: U(.7), background: "#eef0ee" }}>
          <div className="rounded-full h-full pres-bar" style={{ width: `${Math.max(8, (value / max) * 100)}%`, background: color.c, animationDelay: `${0.3 + i * 0.1}s` }} />
        </div>
        <p className="font-semibold truncate" style={{ fontSize: U(.85), color: MUTED }}>{sub}</p>
      </div>
    </div>
  );
}

function SlideLiga({ data, theme }) {
  const { ctx, teams, players } = data.league;
  const maxP = Math.max(...teams.map((t) => t.points), 1);
  const maxG = Math.max(...players.map((p) => p.goals), 1);
  const col = { display: "flex", flexDirection: "column", justifyContent: "space-evenly", height: "100%", gap: U(.5) };
  return (
    <SlideShell>
      <Heading theme={theme} icon={Volleyball} tag="Qism Riyadhah · Top 5" title="Tim & Pemain Futsal Terbaik"
        sub={ctx ? `${ctx.phase_name} · ${ctx.season_name} — hanya laga resmi` : "Liga futsal OSIS"} />
      <Body>
        <div className="pres-panels h-full" style={{ gap: U(1.2) }}>
          <Panel color={PAL.blue} icon={Trophy} title="Klasemen Tim">
            <div style={col}>{teams.length ? teams.map((t, i) => <LigaRow key={t.team_id} i={i} name={t.name} sub={`${t.played} laga · SG ${t.gd > 0 ? "+" : ""}${t.gd}`} value={t.points} max={maxP} unit="poin" color={PAL.blue} />)
              : <p className="font-bold" style={{ color: MUTED }}>Belum ada klasemen</p>}</div>
          </Panel>
          <Panel color={PAL.teal} icon={Target} title="Top Skor Pemain">
            <div style={col}>{players.length ? players.map((p, i) => <LigaRow key={p.student_id ?? p.full_name} i={i} name={p.full_name} sub={`${p.team_name ?? "—"} · ${p.appearances} laga`} value={p.goals} max={maxG} unit="gol" color={PAL.teal} />)
              : <p className="font-bold" style={{ color: MUTED }}>Belum ada gol tercipta</p>}</div>
          </Panel>
        </div>
      </Body>
    </SlideShell>
  );
}

function SlideWeekly({ data, theme }) {
  const rows = data.weekly.map((w) => ({
    key: w.key, name: w.name, sub: `${w.cls ? `Kelas ${w.cls} · ` : ""}${[...w.rules].slice(0, 2).join(", ")}`, value: w.pts,
  }));
  return (
    <SlideShell>
      <Heading theme={theme} icon={AlertTriangle} tag="Qism Riyadhah · Pekan ini" title="Pelanggar Mingguan" sub={`${data.weekRange} · ${rows.length} santri`} />
      <Body>
        {rows.length ? <AutoScroll><div style={{ paddingBottom: U(2) }}><LeagueRows rows={rows} theme={theme} unit="poin" fixed bad /></div></AutoScroll>
          : <Empty theme={PAL.green} text="Pekan ini bersih. Sportif semua!" />}
      </Body>
    </SlideShell>
  );
}

function SlideJadwal({ data, theme }) {
  const list = data.league.upcoming;
  return (
    <SlideShell>
      <Heading theme={theme} icon={CalendarDays} tag="Qism Riyadhah · Liga" title="Jadwal Liga Selanjutnya" sub={data.league.ctx ? `${data.league.ctx.phase_name} · ${data.league.ctx.season_name}` : "Pertandingan terdekat"} />
      <Body>
        {list.length ? (
          <AutoScroll>
            <div className="pres-cols" style={{ gap: U(.9), paddingBottom: U(2) }}>
              {list.map((m, i) => (
                <div key={m.id ?? i} className="pres-pop" style={{ ...card3d(LINE, "#d4d4d4"), padding: `${U(.8)} ${U(1)}`, "--d": `${(i % 8) * 0.06}s` }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: U(.5) }}>
                    <Pill theme={theme}>Pekan {m.week ?? "—"}</Pill>
                    <span className="font-bold" style={{ fontSize: U(.95), color: MUTED }}>{m.scheduled_at ? fmtWhen(m.scheduled_at) : "Jadwal menyusul"}</span>
                  </div>
                  <div className="flex items-center justify-center text-center" style={{ gap: U(.8) }}>
                    <p className="flex-1 min-w-0 font-black truncate" style={{ fontSize: U(1.6), color: INK }}>{m.home_name}</p>
                    <span className="grid place-items-center rounded-full font-black text-white shrink-0" style={{ width: U(2.8), height: U(2.8), background: theme.c, fontSize: U(1) }}>VS</span>
                    <p className="flex-1 min-w-0 font-black truncate" style={{ fontSize: U(1.6), color: INK }}>{m.away_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </AutoScroll>
        ) : <Empty theme={theme} text="Belum ada jadwal pertandingan berikutnya." />}
      </Body>
    </SlideShell>
  );
}

function NadzHalf({ rows, color, icon, title, unit, empty }) {
  return (
    <Panel color={color} icon={icon} title={title}>
      {rows.length ? <LeagueRows rows={rows} theme={color} unit={unit} nameW={9} bad /> : <Empty theme={PAL.green} text={empty} />}
    </Panel>
  );
}

function SlideNadzhofah({ data, theme }) {
  const mk = (list, key) => list.map((r) => ({ key: r.student_id ?? r.full_name, name: r.full_name, sub: `Kelas ${r.class_name ?? "—"}`, value: r[key] ?? 0 }));
  return (
    <SlideShell>
      <Heading theme={theme} icon={AlertTriangle} tag="Nadzhofah · Top 5" title="Kebersihan & Kerapian" sub="Nyeker dan baju disita — ini bukan prestasi, ayo berbenah" />
      <Body>
        <div className="pres-panels h-full" style={{ gap: U(1.2) }}>
          <NadzHalf rows={mk(data.nyeker, "nyeker_count")} color={PAL.red} icon={Footprints} title="Paling sering nyeker" unit="kali" empty="Tidak ada yang nyeker. Mantap!" />
          <NadzHalf rows={mk(data.clothing, "clothing_count")} color={PAL.orange} icon={Shirt} title="Baju sering disita" unit="kali" empty="Tidak ada baju disita. Rapi semua!" />
        </div>
      </Body>
    </SlideShell>
  );
}

// satu slide per mufrodat (3 mufrodat acak harian dari Qism Lughah)
const LEVEL_LABEL = { pemula: "Pemula", menengah: "Menengah", sulit: "Sulit" };
const LEVEL_THEME = { pemula: PAL.green, menengah: PAL.orange, sulit: PAL.violet };
const FIIL_FORMS = [
  ["fiil_mudhari", "Mudhari", "مُضَارِع"],
  ["fiil_amr", "Amr", "أَمْر"],
  ["isim_fail", "Fail", "فَاعِل"],
  ["isim_maful", "Maful", "مَفْعُول"],
];
function SlideLughahWord({ w, i, n, theme }) {
  const fiil = w.word_type === "fiil";
  return (
    <SlideShell>
      <Heading theme={theme} icon={Languages} tag={`Qism Lughah · ${fiil ? "Fiil" : "Ism"} · Tingkat ${i + 1} dari ${n}`} title={`Mufrodat ${LEVEL_LABEL[w.level] ?? "Hari Ini"}`} sub={w.theme ? `Tema: ${w.theme}` : "Mufrodat beserta contoh jumlah mufidah"} />
      <Body>
        <div className="flex flex-col h-full min-h-0" style={{ gap: U(1.1) }}>
          <div className="pres-pop flex flex-col flex-1 min-h-0 items-center justify-center text-center overflow-hidden"
            style={{ ...card3d(theme.c, theme.s, theme.t), gap: U(.8), padding: U(1.2) }}>
            <p lang="ar" dir="rtl" className="font-black leading-snug break-words max-w-full" style={{ fontSize: U(fiil ? 6.5 : 9), color: theme.d }}>{w.arabic}</p>
            <p className="font-extrabold break-words max-w-full" style={{ fontSize: U(fiil ? 2.6 : 3.2), color: INK }}>{w.meaning}</p>
            {!fiil && w.jama && (
              <p className="font-bold" style={{ fontSize: U(1.8), color: MUTED }}>
                Jama’ <span lang="ar">(جَمْعٌ)</span>: <span lang="ar" dir="rtl" className="font-black" style={{ color: theme.d }}>{w.jama}</span>
              </p>
            )}
            {fiil && (
              <div className="grid w-full" style={{ gap: U(.8), gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: U(.4) }}>
                {FIIL_FORMS.map(([k, lbl, ar], j) => (
                  <div key={k} className="pres-pop bg-white" style={{ border: `2px solid ${theme.c}55`, borderRadius: U(1.1), padding: `${U(.5)} ${U(.6)}`, "--d": `${0.2 + j * 0.1}s` }}>
                    <p className="font-extrabold uppercase" style={{ fontSize: U(.8), color: theme.d }}>{lbl} <span lang="ar">({ar})</span></p>
                    <p lang="ar" dir="rtl" className="font-black break-words" style={{ fontSize: U(2.6), color: INK }}>{w[k] || "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pres-pop flex flex-col justify-center text-center" style={{ ...card3d(LINE, "#d4d4d4"), padding: `${U(.9)} ${U(1.4)}`, gap: U(.4), "--d": ".25s" }}>
            <p className="font-extrabold uppercase tracking-wider" style={{ fontSize: U(.95), color: theme.d }}>
              Jumlah Mufidah <span lang="ar">(جُمْلَةٌ مُفِيدَةٌ)</span>
            </p>
            <p lang="ar" dir="rtl" className="font-black leading-snug break-words" style={{ fontSize: U(3.6), color: INK }}>{w.mufidah_text || "—"}</p>
            <p className="font-bold leading-snug" style={{ fontSize: U(1.5), color: MUTED }}>
              Arti kalimat: <span style={{ color: theme.d }}>{w.mufidah_meaning || "—"}</span>
            </p>
          </div>
        </div>
      </Body>
    </SlideShell>
  );
}

function SlideLughahEmpty({ theme }) {
  return (
    <SlideShell>
      <Heading theme={theme} icon={Languages} tag="Qism Lughah · Hari ini" title="Mufrodat Hari Ini" sub="Buat mufidah dari mufrodat pilihan" />
      <Body><Empty theme={theme} text="Qism Lughah belum menambahkan mufrodat." /></Body>
    </SlideShell>
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

// ---------------------------------------------------------------- slide link web (diatur Super Admin)
function toEmbed(u) {
  const m = u.match(/docs\.google\.com\/presentation\/d\/([\w-]+)/);
  return m ? `https://docs.google.com/presentation/d/${m[1]}/embed?start=true&loop=false&delayms=10000` : u;
}
// ---------------------------------------------------------------- daftar slide + narasi
const SLIDES = [
  { sec: "Ibadah", theme: PAL.red, mood: "think", node: (d, t) => <SlideIbadahTop data={d} theme={t} />,
    say: (d) => `Assalamu'alaikum, aku Kak Peci! Ini 5 santri dengan poin pelanggaran ibadah tertinggi bulan ini${d.ibadah[0] ? `, tertinggi ${d.ibadah[0].score} poin` : ""}. Ini bukan prestasi. Ayo berbenah dan jangan diulangi!` },
  { sec: "Ibadah", theme: PAL.green, mood: "read", node: (d, t) => <SlideRules rules={d.rulesIbadah} theme={t} icon={Scale} tag="Qism Ibadah · Aturan" title="Peraturan Ibadah" sub="Poin tiap pelanggaran ibadah" />,
    say: () => "Ini peraturan ibadah beserta poinnya. Dibaca baik-baik ya, supaya poinmu tetap aman!" },
  { sec: "Ibadah", theme: PAL.green, mood: "talk", node: (d, t) => <SlideZikir data={d} theme={t} />,
    say: (d) => `Jadwal zikir yang akan datang${d.zikir[0]?.leader_name ? `, imam terdekat: ${d.zikir[0].leader_name}` : ""}. Jangan sampai terlambat!` },
  { sec: "Riyadhah", theme: PAL.blue, mood: "cheer", node: (d, t) => <SlideLiga data={d} theme={t} />,
    say: (d) => `Saatnya futsal! ${d.league.teams[0] ? `Tim ${d.league.teams[0].name} memimpin klasemen. ` : ""}${d.league.players[0] ? `Top skor: ${d.league.players[0].full_name}, ${d.league.players[0].goals} gol.` : "Belum ada gol tercatat."}` },
  { sec: "Riyadhah", theme: PAL.red, mood: "think", node: (d, t) => <SlideWeekly data={d} theme={t} />,
    say: (d) => d.weekly.length ? `Pekan ini ada ${d.weekly.length} santri yang melanggar aturan riyadhah. Pelanggaran merugikan tim. Main bersih dong!` : "Pekan ini belum ada pelanggaran riyadhah. Sportif sekali!" },
  { sec: "Riyadhah", theme: PAL.blue, mood: "read", node: (d, t) => <SlideRules rules={d.rulesRiyadhah} theme={t} icon={Scale} tag="Qism Riyadhah · Aturan" title="Peraturan Riyadhah" sub="Poin dan skors untuk pelanggaran riyadhah" />,
    say: () => "Peraturan riyadhah. Beberapa pelanggaran bisa membuat pemain diskors, jadi perhatikan baik-baik!" },
  { sec: "Riyadhah", theme: PAL.blue, mood: "wave", node: (d, t) => <SlideJadwal data={d} theme={t} />,
    say: (d) => d.league.upcoming[0] ? `Pertandingan berikutnya: ${d.league.upcoming[0].home_name} lawan ${d.league.upcoming[0].away_name}. Jangan lupa datang dan beri semangat!` : "Jadwal pertandingan berikutnya belum tersedia." },
  { sec: "Nadzhofah", theme: PAL.red, mood: "think", node: (d, t) => <SlideNadzhofah data={d} theme={t} />,
    say: () => "Nadzhofah itu soal kebersihan dan kerapian. Ini santri yang paling sering nyeker dan yang bajunya paling sering disita. Ini bukan prestasi, ayo berbenah!" },
  { sec: "Fitur web", theme: PAL.orange, mood: "wave", node: (d, t) => <SlideFeatures f={FEATURES[0]} theme={t} />,
    say: () => "Sekarang kenalan dengan fitur web. Bagian pertama: curhat, artikel, catatan pribadi, kalender, dan laporan." },
  { sec: "Fitur web", theme: PAL.teal, mood: "talk", node: (d, t) => <SlideFeatures f={FEATURES[1]} theme={t} />,
    say: () => "Bagian kedua: tiap qism punya ruang kerja sendiri, dari liga futsal sampai kartu dan suspensi." },
  { sec: "Fitur web", theme: PAL.violet, mood: "read", node: (d, t) => <SlideFeatures f={FEATURES[2]} theme={t} />,
    say: () => "Bagian ketiga: aturan poin otomatis, rekap siap cetak, log audit, pembagian akses, dan bisa dipasang di HP." },
  { sec: "Kunjungi", theme: PAL.green, mood: "wave", node: () => <SlideEnd />,
    say: () => `Yuk buka ${SITE_LABEL} dari HP masing-masing. Terima kasih sudah menyimak!` },
];
// 3 mufrodat acak harian → 3 slide Lughah, disisipkan setelah Nadzhofah
function buildSlides(d) {
  const v = d.vocab ?? [];
  const lughah = v.length
    ? v.map((w, i) => ({
        sec: "Lughah", theme: LEVEL_THEME[w.level] ?? PAL.violet, mood: ["cheer", "read", "talk"][i % 3],
        node: (dd, t) => <SlideLughahWord w={w} i={i} n={v.length} theme={t} />,
        say: () => `Mufrodat tingkat ${(LEVEL_LABEL[w.level] ?? "").toLowerCase()}: artinya ${w.meaning}.${w.jama ? ` Jama’nya ${w.jama}.` : ""} Perhatikan contoh jumlah mufidah-nya, lalu buat kalimatmu sendiri!`,
      }))
    : [{ sec: "Lughah", theme: PAL.violet, mood: "talk", node: (dd, t) => <SlideLughahEmpty theme={t} />, say: () => "Qism Lughah belum menambahkan mufrodat hari ini." }];
  return [...SLIDES.slice(0, 8), ...lughah, ...SLIDES.slice(8)];
}

function Btn({ color = PAL.green, outline = false, children, style, ...p }) {
  return (
    <button {...p} className="pres-btn font-extrabold uppercase tracking-wide"
      style={{
        fontSize: U(1.1), padding: `${U(.8)} ${U(1.8)}`, borderRadius: U(1.2),
        background: outline ? "#fff" : color.c, color: outline ? color.d : "#fff",
        ...edge(outline ? LINE : color.c, outline ? "#d4d4d4" : color.s), ...style,
      }}>
      {children}
    </button>
  );
}


// ---------------------------------------------------------------- intro / outro / klip
function IntroScreen({ onDone, vh }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 2300), setTimeout(() => setStep(2), 4600), setTimeout(onDone, 7600)];
    return () => t.forEach(clearTimeout);
  }, [onDone]);
  const word = step === 0 ? { t: "ISCAR", c: PAL.orange } : { t: "IBADAH", c: PAL.green };
  return (
    <div onClick={onDone} className="z-40 absolute inset-0 flex flex-col justify-center items-center text-center"
      style={{ gap: U(1.2), background: `linear-gradient(180deg, ${PAL.green.t}, #fff 75%)`, cursor: "pointer" }}>
      <div className="pres-pop"><BkMascot mood={step === 2 ? "cheer" : "wave"} size={Math.round(Math.min(vh * 0.26, 190))} /></div>
      <p className="font-extrabold uppercase tracking-widest pres-pop" style={{ fontSize: U(1.2), color: MUTED, "--d": ".2s" }}>Presentasi OSIS</p>
      <h1 className="font-black tracking-tight leading-none" style={{ fontSize: U(7.2), color: INK }}>
        Dari <span key={word.t} className="pres-pop inline-block" style={{ color: word.c.d }}>{word.t}</span>
      </h1>
      <div style={{ height: U(6), minHeight: U(6) }}>
        {step === 2 && (
          <p className="pres-pop font-black" style={{ fontSize: U(3.6), color: PAL.blue.d }}>Untuk semua</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- halaman utama
export default function PresentationPage() {
  const nav = useNavigate();
  const { session, signOut } = useAuth();
  const vh = useViewportH();
  const [data, setData] = useState(null);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState("slides"); // intro → slides → outro → refresh
  const idxRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [prog, setProg] = useState(0);
  const [full, setFull] = useState(false);
  const [active, setActive] = useState(true);
  const elapsed = useRef(0);
  const hideT = useRef();
  const needs = useRef(new Map());
  const slides = useMemo(() => (data ? buildSlides(data) : []), [data]);
  const N = slides.length || 1;
  const needCtx = useMemo(() => ({ set: (id, ms) => (ms ? needs.current.set(id, ms) : needs.current.delete(id)) }), []);

  useEffect(() => { loadData().then(setData); }, []);
  idxRef.current = idx;
  const toIntro = useCallback(() => setPhase("slides"), []);
  const slidesRef = useRef([]);
  slidesRef.current = slides;
  // Kembali ke slide pertama TANPA reload halaman: layar penuh & wake lock tetap hidup, TV tidak mati.
  const restart = useCallback(() => {
    elapsed.current = 0; setProg(0); setIdx(0);
    loadData().then(setData).catch(() => {});
  }, []);

  // Slide link sedang dipakai (diketik/disentuh) → jeda otomatis; selesai → lanjut
  useEffect(() => {
    const pause = () => setAuto(false);
    const play = () => { elapsed.current = 0; setProg(0); setAuto(true); };
    window.addEventListener("pres:interact", pause);
    window.addEventListener("pres:resume", play);
    return () => { window.removeEventListener("pres:interact", pause); window.removeEventListener("pres:resume", play); };
  }, []);

  const go = useCallback((n) => { elapsed.current = 0; setProg(0); setIdx(((n % N) + N) % N); }, [N]);

  useEffect(() => {
    if (!started || !auto || phase !== "slides") return;
    const t = setInterval(() => {
      elapsed.current += 100;
      const limit = slidesRef.current[idxRef.current]?.ms ?? Math.max(SLIDE_MS, ...needs.current.values());
      setProg(elapsed.current / limit);
      if (elapsed.current >= limit) {
        elapsed.current = 0; setProg(0);
        if (idxRef.current >= N - 1) restart(); else setIdx((v) => v + 1);
      }
    }, 100);
    return () => clearInterval(t);
  }, [started, auto, N, phase, restart]);

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
    const acquire = () => navigator.wakeLock.request("screen").then((l) => (lock = l)).catch(() => {});
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); lock?.release?.().catch(() => {}); };
  }, [started]);

  useEffect(() => {
    const wake = () => {
      setActive(true);
      clearTimeout(hideT.current);
      hideT.current = setTimeout(() => setActive(false), 3000);
    };
    const key = (e) => {
      wake();
      if (!started || phase !== "slides") return;
      const tg = e.target;
      if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable)) return; // sedang mengetik
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
  }, [started, phase, idx, go, toggleFull, N]);

  const start = (fullscreen) => {
    setStarted(true); setIdx(0); setAuto(true); elapsed.current = 0; setPhase("intro");
    if (fullscreen) toggleFull();
  };
  useEffect(() => {
    if (!data || started) return;
    let resume = false;
    try { resume = sessionStorage.getItem(RESUME_KEY) === "1"; sessionStorage.removeItem(RESUME_KEY); } catch { /* abaikan */ }
    if (resume) { setStarted(true); setIdx(0); setAuto(true); setPhase("slides"); }
  }, [data, started]);
  const exit = async () => {
    if (document.fullscreenElement) document.exitFullscreen();
    // Akun presentasi: keluar = logout (tidak boleh membuka dashboard)
    if (isPresentationEmail(session?.user?.email)) { await signOut(); nav("/auth/login", { replace: true }); return; }
    nav(session ? "/admin" : "/auth/login");
  };

  const S = slides[idx] ?? SLIDES[0];
  const theme = S.theme;
  const text = data ? S.say(data) : "";
  const typed = useTypewriter(started ? text : "", 22);
  const stage = useMemo(() => (data && slides[idx] ? slides[idx].node(data, slides[idx].theme) : null), [data, slides, idx]);
  const mascotSize = Math.round(Math.min(vh * 0.11, 90));

  return (
    <div className="z-[300] fixed inset-0 flex flex-col overflow-hidden font-sans select-none"
      style={{ "--u": "min(1vw, 1.78vh)", color: INK, cursor: active ? "default" : "none", background: `linear-gradient(180deg, ${theme.t} 0%, #fff 60%)`, transition: "background .5s" }}>
      <style>{CSS}</style>
      <span aria-hidden="true" className="pres-float absolute rounded-full pointer-events-none" style={{ width: U(26), height: U(26), right: U(-8), top: U(-9), background: theme.c, opacity: .09 }} />
      <span aria-hidden="true" className="pres-float absolute rounded-full pointer-events-none" style={{ width: U(16), height: U(16), left: U(-6), bottom: U(8), background: theme.c, opacity: .07, animationDelay: "-3s" }} />

      {!started && (
        <div className="z-30 absolute inset-0 flex flex-col justify-center items-center text-center" style={{ gap: U(1.4), background: `linear-gradient(180deg, ${PAL.green.t}, #fff 70%)` }}>
          <div className="flex items-end" style={{ gap: U(1) }}>
            <BkMascot mood="wave" size={Math.round(Math.min(vh * 0.22, 150))} />
            <div className="mb-[2vh] font-extrabold" style={{ ...card3d(LINE, "#d4d4d4"), fontSize: U(1.4), padding: `${U(.8)} ${U(1.3)}` }}>Yuk mulai!</div>
          </div>
          <h1 className="font-black tracking-tight" style={{ fontSize: U(4.4), color: PAL.green.d }}>Presentasi OSIS</h1>
          <p className="font-semibold" style={{ fontSize: U(1.4), color: MUTED }}>Ibadah · Riyadhah · Nadzhofah · Lughah · Fitur Web</p>
          <div className="flex flex-col items-center" style={{ gap: U(.9), width: U(30) }}>
            <Btn onClick={() => start(true)} disabled={!data} style={{ width: "100%", opacity: data ? 1 : 0.6 }}>{data ? "Mulai (layar penuh)" : "Menyiapkan data…"}</Btn>
            <Btn outline onClick={() => start(false)} disabled={!data} style={{ width: "100%" }}>Mulai tanpa layar penuh</Btn>
          </div>
          <p className="font-bold" style={{ fontSize: U(1), color: "#aaa" }}>← → geser · Spasi jeda/lanjut · F layar penuh</p>
          <button onClick={exit} aria-label="Keluar" className="top-4 left-4 absolute hover:bg-black/5 p-2.5 rounded-full text-[#afafaf]"><X size={26} /></button>
        </div>
      )}

      {started && phase === "intro" && <IntroScreen vh={vh} onDone={toIntro} />}

      {started && phase === "slides" && (
        <NeedCtx.Provider value={needCtx}>
          {/* progres bersegmen + bagian + keluar */}
          <div className="relative z-10 flex shrink-0 items-center" style={{ gap: U(1), padding: `${U(.9)} ${U(2.4)} 0` }}>
            <button onClick={exit} aria-label="Keluar" className="hover:bg-black/5 p-1.5 rounded-full text-[#afafaf]"><X size={24} /></button>
            <div className="flex flex-1" style={{ gap: U(.4) }}>
              {slides.map((s, i) => (
                <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => go(i)} className="relative flex-1 rounded-full overflow-hidden" style={{ height: U(1.1), background: "#e5e5e5" }}>
                  <span className="top-0 left-0 absolute rounded-full h-full transition-[width] duration-100 ease-linear"
                    style={{ background: s.theme.c, width: i < idx ? "100%" : i === idx ? `${auto ? Math.max(prog, 0.04) * 100 : 100}%` : "0%" }} />
                </button>
              ))}
            </div>
            <span className="font-black uppercase tracking-wide" style={{ fontSize: U(.95), color: theme.d }}>{S.sec}</span>
            <span className="font-black tabular-nums" style={{ fontSize: U(1.1), color: MUTED }}>{idx + 1}/{N}</span>
          </div>

          {/* panggung penuh */}
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden" style={{ padding: `${U(1.2)} ${U(3)} ${U(.6)}` }}>
            {stage && <div key={idx} className="h-full pres-in">{stage}</div>}
          </div>

          <button aria-label="Sebelumnya" onClick={() => go(idx - 1)} className="top-[10vh] bottom-[16vh] left-0 z-20 absolute w-[3vw] cursor-w-resize" />
          <button aria-label="Berikutnya" onClick={() => go(idx + 1)} className="top-[10vh] right-0 bottom-[16vh] z-20 absolute w-[3vw] cursor-e-resize" />

          {/* dock: maskot + gelembung + tombol */}
          <div className="relative z-10 flex shrink-0 items-end" style={{ gap: U(1), padding: `${U(.3)} ${U(3)} ${U(.8)}` }}>
            <div className="shrink-0"><BkMascot key={`${idx}-${S.mood}`} mood={S.mood} size={mascotSize} /></div>
            <div className="min-w-0 flex-1" style={{ ...card3d(LINE, "#d4d4d4"), padding: `${U(.6)} ${U(1.1)}`, minHeight: U(5.2) }}>
              <span className="font-extrabold" style={{ color: theme.d, fontSize: U(.85) }}>Kak Peci</span>
              <p className="font-bold leading-snug" style={{ fontSize: U(1.15), color: INK }}>
                {typed}<span className="pres-caret" style={{ color: theme.c }}>▍</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center transition-opacity duration-500" style={{ gap: U(.6), opacity: active ? 1 : 0.15 }}>
              <Btn outline color={theme} onClick={() => setAuto((v) => !v)} aria-label="Jeda atau putar" style={{ padding: U(.8) }}>{auto ? <Pause size={20} /> : <Play size={20} />}</Btn>
              <Btn outline color={theme} onClick={toggleFull} aria-label="Layar penuh" style={{ padding: U(.8) }}>{full ? <Minimize size={20} /> : <Maximize size={20} />}</Btn>
              <Btn outline color={theme} onClick={() => go(idx - 1)}>Kembali</Btn>
              <Btn color={theme} onClick={() => go(idx + 1)}>{idx === N - 1 ? "Ulangi" : "Lanjut"}</Btn>
            </div>
          </div>
        </NeedCtx.Provider>
      )}
    </div>
  );
}
