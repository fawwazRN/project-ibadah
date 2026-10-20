// Portal Orang Tua — /ortu. Tanpa akun: cukup email anak (santri) → progres muncul.
// Desain "play" (sama dengan halaman santri): chunky, bulat, dipandu maskot Kak Peci.
// Tab: Ringkasan · Ibadah · Riyadhah · Nadzhofah · Lughah · Rekapan OSIS (unduh PDF) · Pesan (disaring AI).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Download,
  Languages,
  Loader2,
  Medal,
  MessagesSquare,
  Send,
  ShieldAlert,
  Shirt,
  Sparkles,
  Volleyball,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useShell } from "../../hooks/useShell";
import { Mascot } from "../../components/ui/Mascot";
import { BrandMark } from "../../components/ui/BrandMark";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { LoadingState } from "../../components/ui/States";
import ReportCard from "../../components/ortu/ReportCard";
import { PERIODS, buildReport, dayLabel, rupiah } from "../../lib/rapor";

const KEY = "ortu.email";

const TABS = [
  { id: "ringkasan", label: "Ringkasan", icon: Sparkles, cls: "q-brand" },
  { id: "ibadah", label: "Ibadah", icon: BookOpenCheck, cls: "q-ibadah" },
  { id: "riyadhah", label: "Riyadhah", icon: Volleyball, cls: "q-riyadhah" },
  { id: "nadzhofah", label: "Nadzhofah", icon: Shirt, cls: "q-nadzhofah" },
  { id: "lughah", label: "Lughah", icon: Languages, cls: "q-lughah" },
  { id: "rekap", label: "Rekapan OSIS", icon: Medal, cls: "q-gold" },
  { id: "pesan", label: "Pesan", icon: MessagesSquare, cls: "q-slate" },
];
const T = Object.fromEntries(TABS.map((t) => [t.id, t]));
const head = { fontWeight: 900 };

// ------------------------------------------------------------------ kecil-kecil
function Ring({
  value,
  size = 92,
  stroke = 9,
  track = "rgba(255,255,255,.28)",
  color = "#fff",
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = value == null ? 0 : Math.max(0, Math.min(100, value));
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(target), 60);
    return () => clearTimeout(t);
  }, [target]);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 place-items-center grid">{children}</div>
    </div>
  );
}

function GradeChip({ grade }) {
  if (!grade)
    return <span className="font-bold text-fg-4 text-xs">Belum ada nilai</span>;
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full font-black text-[11px]"
      style={{ background: grade.tint, color: grade.color }}>
      {grade.ar}
    </span>
  );
}

function Banner({ qid, label, value, sub, grade }) {
  return (
    <div
      className={`${T[qid].cls} flex items-center gap-4 rounded-[20px] p-4`}
      style={{
        background: "var(--q)",
        color: "var(--q-on)",
        boxShadow: "0 4px 0 var(--q-edge)",
      }}>
      <div className="flex-1 min-w-0">
        <p className="opacity-85 font-extrabold text-[11px] uppercase tracking-widest">
          {label}
        </p>
        <p className="font-display text-[44px] leading-none" style={head}>
          {value ?? "—"}
        </p>
        {sub && <p className="opacity-90 mt-1 font-bold text-xs">{sub}</p>}
      </div>
      {grade && (
        <div
          className="bg-white/90 px-3 py-2 rounded-2xl text-center"
          style={{ color: grade.color }}>
          <p className="font-display text-xl leading-none" style={head}>
            {grade.letter}
          </p>
          <p className="mt-0.5 font-extrabold text-[10px]">{grade.ar}</p>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value, qid }) {
  return (
    <div
      className={`${T[qid].cls} rounded-2xl border-2 p-3 text-center`}
      style={{ background: "var(--q-tint)", borderColor: "var(--q-line)" }}>
      <p
        className="font-display text-2xl leading-none"
        style={{ ...head, color: "var(--q-dim)" }}>
        {value}
      </p>
      <p className="mt-1 font-extrabold text-[10px] text-fg-3 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}

function Rec({ qid, icon: Icon, title, sub, right }) {
  return (
    <div
      className={`${T[qid].cls} flex items-center gap-3 bg-card p-3 border-2 border-line rounded-2xl`}
      style={{ boxShadow: "0 3px 0 var(--color-line)" }}>
      <span
        className="place-items-center grid rounded-xl size-10 shrink-0"
        style={{ background: "var(--q-tint)", color: "var(--q-dim)" }}>
        <Icon size={18} strokeWidth={2.4} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-fg text-sm truncate">{title}</p>
        {sub && <p className="font-semibold text-fg-3 text-xs">{sub}</p>}
      </div>
      {right && (
        <span
          className="px-2.5 py-1 rounded-full font-black text-xs shrink-0"
          style={{ background: "var(--q-tint)", color: "var(--q-dim)" }}>
          {right}
        </span>
      )}
    </div>
  );
}

function Good({ text }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-card px-6 py-8 border-2 border-line rounded-[20px] text-center">
      <Mascot mood="cheer" size={84} className="animate-float" />
      <p className="max-w-xs font-extrabold text-fg-2 text-sm">{text}</p>
    </div>
  );
}

const Block = ({ title, children }) => (
  <section className="space-y-2">
    <h3
      className="px-1 font-display text-[13px] text-fg-2 uppercase tracking-wider"
      style={head}>
      {title}
    </h3>
    {children}
  </section>
);

// ------------------------------------------------------------------ pratinjau kertas
function PaperFit({ children }) {
  const wrap = useRef(null);
  const inner = useRef(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(1123);
  useEffect(() => {
    const fit = () => {
      if (!wrap.current || !inner.current) return;
      setScale(Math.min(1, wrap.current.clientWidth / 794));
      setH(inner.current.offsetHeight);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap.current);
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={wrap}
      className="bg-soft-2 border-2 border-line rounded-2xl w-full overflow-hidden"
      style={{ height: h * scale }}>
      <div
        ref={inner}
        style={{
          width: 794,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ pesan
function Chat({ email }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const { data } = await supabase.rpc("parent_messages_list", {
      p_email: email,
    });
    setMsgs(data ?? []);
  }, [email]);
  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);
  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    setNote("");
    const { data, error } = await supabase.functions.invoke("parent-message", {
      body: { email, body },
    });
    setBusy(false);
    if (error || data?.error) {
      // Untuk respons non-2xx, pesan asli dari fungsi ada di error.context (Response)
      let msg = data?.error;
      if (!msg && error?.context?.json) {
        msg = await error.context.json().then((j) => j?.error).catch(() => null);
      }
      return setNote(msg ?? "Pesan belum bisa dikirim. Coba lagi sebentar.");
    }
    if (data.status === "blocked") setNote(`Pesan diblokir AI: ${data.reason}`);
    else setText("");
    load();
  };
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 bg-sky-50 p-3 border-2 border-sky-200 rounded-2xl">
        <Mascot mood="care" size={52} />
        <p className="font-semibold text-sky-900 text-xs leading-relaxed">
          Kirim nasihat & semangat untuk ananda. Pesan hanya untuk nasihat dan
          pembinaan — selain itu akan disaring AI dan tidak sampai ke anak.
        </p>
      </div>
      <div className="space-y-2">
        {msgs.length === 0 && (
          <p className="py-6 font-semibold text-fg-3 text-sm text-center">
            Belum ada pesan. Tulis yang pertama!
          </p>
        )}
        {msgs.map((m) => {
          const ok = m.status === "sent";
          return (
            <div
              key={m.id}
              className={`flex ${ok ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-semibold ${ok ? "rounded-br-md bg-brand text-on-brand" : "rounded-bl-md border-2 border-rose-200 bg-rose-50 text-rose-800"}`}>
                <p className="break-words">{m.body}</p>
                <p
                  className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${ok ? "opacity-80" : "text-rose-600"}`}>
                  {ok ? (
                    <>
                      <Check size={12} /> Terkirim
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={12} /> Diblokir: {m.reason}
                    </>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {note && (
        <p className="bg-rose-50 px-3.5 py-2.5 border-2 border-rose-200 rounded-2xl font-bold text-rose-700 text-xs">
          {note}
        </p>
      )}
      <form onSubmit={send} className="flex gap-2">
        <Input
          maxLength={1000}
          placeholder="Tulis nasihat untuk anak…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          aria-label="Kirim"
          className="px-4">
          {!busy && <Send size={16} strokeWidth={2.6} />}
        </Button>
      </form>
    </div>
  );
}

// ------------------------------------------------------------------ halaman
export default function ParentApp() {
  useShell({ skin: "play", qism: null, themeColor: "#22b573" });
  const [email, setEmail] = useState(() => localStorage.getItem(KEY) ?? "");
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [lughah, setLughah] = useState(undefined); // undefined = memuat · null = tak tersedia
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("ringkasan");
  const [periodKey, setPeriodKey] = useState("all");

  const load = useCallback(async (em) => {
    setBusy(true);
    setErr("");
    const { data: d, error } = await supabase.rpc("parent_view", {
      p_email: em,
    });
    setBusy(false);
    if (error || !d?.student) {
      setErr(error?.message ?? "Email santri tidak ditemukan.");
      localStorage.removeItem(KEY);
      setEmail("");
      return;
    }
    localStorage.setItem(KEY, em);
    setEmail(em);
    setData(d);
  }, []);
  useEffect(() => {
    if (email && !data) load(email);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Nilai & kelengkapan Lughah (RPC khusus orang tua — lihat supabase/parent_report.sql)
  useEffect(() => {
    if (!data || !email) return;
    setLughah(undefined);
    supabase
      .rpc("parent_lughah", { p_email: email })
      .then(({ data: d, error }) => setLughah(error ? null : (d ?? null)));
  }, [data, email]);

  const model = useMemo(
    () =>
      data ? buildReport({ data, lughah: lughah ?? null, periodKey }) : null,
    [data, lughah, periodKey],
  );
  const printedAt = useMemo(
    () =>
      new Date().toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    [data, periodKey],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = () => {
    localStorage.removeItem(KEY);
    setData(null);
    setEmail("");
    setLughah(undefined);
    setTab("ringkasan");
  };

  // Unduh rekapan OSIS: cetak halaman A4 portrait → "Simpan sebagai PDF"
  const download = () => {
    const style = document.createElement("style");
    style.textContent = "@page{size:A4 portrait;margin:0}";
    document.head.appendChild(style);
    const prevTitle = document.title;
    document.title = `Rekapan OSIS - ${model.student.full_name}`;
    const done = () => {
      style.remove();
      document.title = prevTitle;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    setTimeout(() => window.print(), 150);
  };

  // ------------------------------------------------------------ belum masuk
  if (!data) {
    if (email && busy) {
      return (
        <div className="bg-page p-5 min-h-dvh">
          <div className="mx-auto pt-16 max-w-sm">
            <LoadingState rows={4} />
          </div>
        </div>
      );
    }
    return (
      <div className="safe-top safe-bottom flex justify-center items-center bg-page p-5 min-h-dvh">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(input.trim().toLowerCase());
          }}
          className="space-y-4 w-full max-w-sm stagger">
          <div className="flex flex-col items-center text-center">
            <Mascot
              mood={busy ? "think" : err ? "sad" : "wave"}
              size={124}
              interactive
              className="animate-float"
            />
            <p
              className="flex items-center gap-1.5 mt-1 font-display text-brand-dim text-xl"
              style={head}>
              <BrandMark className="size-6" /> osis
            </p>
          </div>
          <div className="text-center">
            <h1 className="font-display text-fg text-2xl" style={head}>
              Portal Orang Tua
            </h1>
            <p className="mt-1 font-semibold text-fg-3 text-sm leading-relaxed">
              Pantau perkembangan ananda dan unduh rekapan OSIS-nya. Masukkan email akun
              anak (santri).
            </p>
          </div>
          <Field label="Email santri" required>
            <Input
              type="email"
              inputMode="email"
              required
              placeholder="nama@student.abudzar.sch.id"
              autoComplete="email"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </Field>
          {err && (
            <p className="bg-rose-50 px-3.5 py-2.5 border-2 border-rose-200 rounded-2xl font-bold text-rose-700 text-xs">
              {err}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" loading={busy}>
            Lihat perkembangan
          </Button>
          <Link
            to="/auth/login"
            className="block py-2 font-extrabold text-fg-3 text-xs text-center">
            Kembali ke halaman masuk
          </Link>
        </form>
      </div>
    );
  }

  // ------------------------------------------------------------ sudah masuk
  const s = model.student;
  const first = (s.full_name ?? "").split(" ")[0];
  const og = model.overall.grade;
  const { ibadah, riyadhah, nadzhofah, lughah: lg } = model;

  const recent = [
    ...ibadah.list.map((v) => ({
      id: `i${v.id}`,
      qid: "ibadah",
      icon: BookOpenCheck,
      title: v.rule?.name ?? "Pelanggaran ibadah",
      at: v.occurred_at ?? v.created_at,
      right: `${v.rule?.points ?? 0} poin`,
      note: v.note,
    })),
    ...riyadhah.list.map((v) => ({
      id: `r${v.id}`,
      qid: "riyadhah",
      icon: Volleyball,
      title: v.rule?.name ?? "Pelanggaran riyadhah",
      at: v.occurred_at ?? v.created_at,
      right: `${v.rule?.points ?? 0} poin`,
      note: v.note,
    })),
    ...nadzhofah.nyekerList.map((n) => ({
      id: `n${n.id}`,
      qid: "nadzhofah",
      icon: Shirt,
      title: "Nyeker",
      at: n.nyeker_date,
      right: n.fine_amount ? rupiah(n.fine_amount) : null,
      note: n.note,
    })),
    ...nadzhofah.clothingList.map((c) => ({
      id: `c${c.id}`,
      qid: "nadzhofah",
      icon: Shirt,
      title: "Pakaian disita",
      at: c.created_at,
      right: `${c.quantity ?? 1} pcs`,
      note: c.note,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 5);

  const RecList = ({ qid, icon, items, empty }) =>
    items.length === 0 ? (
      <Good text={empty} />
    ) : (
      <div className="space-y-2">
        {items.map((v) => (
          <Rec
            key={v.id}
            qid={qid}
            icon={icon}
            title={v.rule?.name ?? "Pelanggaran"}
            sub={[dayLabel(v.occurred_at ?? v.created_at), v.note]
              .filter(Boolean)
              .join(" · ")}
            right={`${v.rule?.points ?? 0} poin`}
          />
        ))}
      </div>
    );

  return (
    <>
      <div className="print:hidden bg-page min-h-dvh">
        {/* header */}
        <header className="safe-top top-0 z-30 sticky bg-card/90 backdrop-blur border-line border-b-2">
          <div className="flex items-center gap-3 mx-auto px-4 py-2.5 max-w-3xl">
            <span
              className="place-items-center grid bg-brand rounded-xl size-9 text-on-brand"
              style={{ boxShadow: "0 3px 0 var(--color-edge)" }}>
              <BrandMark className="size-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="font-display text-[15px] text-fg truncate"
                style={head}>
                {s.full_name}
              </p>
              <p className="font-bold text-fg-3 text-xs">
                {s.class_name ?? "Portal Orang Tua"}
              </p>
            </div>
            <Avatar name={s.full_name} size="md" className="hidden sm:grid" />
            <Button variant="secondary" size="sm" onClick={logout}>
              Ganti anak
            </Button>
          </div>
        </header>

        <main className="space-y-4 mx-auto p-4 pb-16 max-w-3xl">
          {/* hero */}
          <section
            className="relative p-5 rounded-[24px] overflow-hidden text-white"
            style={{
              background: "linear-gradient(135deg,#22b573 0%,#168a57 100%)",
              boxShadow: "0 5px 0 #0f6b44",
            }}>
            <span className="-top-10 -right-8 absolute bg-white/10 rounded-full size-40" />
            <span className="-bottom-12 left-24 absolute bg-white/10 rounded-full size-32" />
            <div className="relative flex items-center gap-4">
              <Ring value={model.overall.score} size={96}>
                <div className="text-center">
                  <p
                    className="font-display text-[30px] leading-none"
                    style={head}>
                    {model.overall.score ?? "—"}
                  </p>
                  <p className="opacity-85 font-extrabold text-[10px] uppercase tracking-widest">
                    nilai
                  </p>
                </div>
              </Ring>
              <div className="flex-1 min-w-0">
                <p className="opacity-85 font-extrabold text-[11px] uppercase tracking-widest">
                  Assalamu’alaikum, Bapak/Ibu
                </p>
                <h1
                  className="font-display text-2xl leading-tight"
                  style={head}>
                  Perkembangan {first}
                </h1>
                <p className="mt-1 font-bold text-sm">
                  {og ? `${og.ar} · ${og.id}` : "Belum ada nilai"}
                </p>
              </div>
              <Mascot
                mood={og && model.overall.score >= 80 ? "cheer" : "care"}
                size={92}
                className="hidden sm:block animate-float"
              />
            </div>
            <div className="relative flex gap-2 mt-4">
              <Button
                variant="secondary"
                size="md"
                icon={Download}
                className="flex-1"
                onClick={() => setTab("rekap")}>
                Rekapan
              </Button>
              <button
                type="button"
                onClick={() => setTab("pesan")}
                className="inline-flex flex-1 justify-center items-center gap-2 px-4 rounded-[14px] h-11 font-extrabold text-[13px] text-white uppercase tracking-wide"
                style={{
                  background: "rgba(255,255,255,.18)",
                  border: "2px solid rgba(255,255,255,.45)",
                }}>
                <MessagesSquare size={16} strokeWidth={2.4} /> Pesan
              </button>
            </div>
          </section>

          {/* tab */}
          <nav
            className="top-[58px] z-20 sticky bg-page/95 -mx-4 px-4 py-1 overflow-x-auto no-scrollbar"
            aria-label="Bagian">
            <div className="flex gap-2 w-max">
              {TABS.map((t) => {
                const on = tab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-pressed={on}
                    className={`${t.cls} inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-extrabold border-2 transition-transform active:translate-y-0.5`}
                    style={
                      on
                        ? {
                            background: "var(--q)",
                            color: "var(--q-on)",
                            borderColor: "var(--q-edge)",
                            boxShadow: "0 3px 0 var(--q-edge)",
                          }
                        : {
                            background: "var(--color-card)",
                            color: "var(--color-fg-3)",
                            borderColor: "var(--color-line)",
                            boxShadow: "0 3px 0 var(--color-line)",
                          }
                    }>
                    <Icon size={15} strokeWidth={2.5} /> {t.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* periode */}
          {tab !== "pesan" && tab !== "lughah" && (
            <div className="seg" role="group" aria-label="Periode">
              {PERIODS.map((p) => (
                <button
                  key={p.id ?? p.key}
                  type="button"
                  aria-pressed={periodKey === p.key}
                  onClick={() => setPeriodKey(p.key)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div key={tab} className="space-y-4 animate-fade-up">
            {/* ---------- Ringkasan ---------- */}
            {tab === "ringkasan" && (
              <>
                <div className="gap-3 grid grid-cols-2">
                  {model.areas.map((a) => {
                    const t = T[a.key];
                    const Icon = t.icon;
                    return (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => setTab(a.key)}
                        className={`${t.cls} lift bg-card p-3.5 border-2 rounded-[20px] text-left`}
                        style={{
                          borderColor: "var(--q-line)",
                          boxShadow: "0 4px 0 var(--q-line)",
                        }}>
                        <span
                          className="place-items-center grid rounded-xl size-9"
                          style={{
                            background: "var(--q-tint)",
                            color: "var(--q-dim)",
                          }}>
                          <Icon size={17} strokeWidth={2.4} />
                        </span>
                        <p className="mt-2 font-extrabold text-[11px] text-fg-3 uppercase tracking-wider">
                          {t.label}
                        </p>
                        <p
                          className="font-display text-[32px] leading-none"
                          style={{ ...head, color: "var(--q-dim)" }}>
                          {a.score ?? "—"}
                        </p>
                        <div className="mt-1.5">
                          <GradeChip grade={a.grade} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="flex items-start gap-3 bg-card p-4 border-2 border-line rounded-[20px]"
                  style={{ boxShadow: "0 4px 0 var(--color-line)" }}>
                  <Mascot mood="talk" size={56} className="shrink-0" />
                  <div>
                    <p className="font-display text-fg text-sm" style={head}>
                      Catatan untuk Bapak/Ibu
                    </p>
                    <p className="mt-1 font-semibold text-[13px] text-fg-2 leading-relaxed">
                      {model.note}
                    </p>
                  </div>
                </div>

                <Block title="Aktivitas terbaru">
                  {recent.length === 0 ? (
                    <Good text="Belum ada catatan pada periode ini. Alhamdulillah!" />
                  ) : (
                    <div className="space-y-2">
                      {recent.map((r) => (
                        <Rec
                          key={r.id}
                          qid={r.qid}
                          icon={r.icon}
                          title={r.title}
                          sub={[dayLabel(r.at), r.note]
                            .filter(Boolean)
                            .join(" · ")}
                          right={r.right}
                        />
                      ))}
                    </div>
                  )}
                </Block>

                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  onClick={() => setTab("rekap")}>
                  Lihat & unduh rekapan OSIS
                </Button>
              </>
            )}

            {/* ---------- Ibadah ---------- */}
            {tab === "ibadah" && (
              <>
                <Banner
                  qid="ibadah"
                  label="Skor ibadah"
                  value={ibadah.score}
                  sub={`${ibadah.pts} poin pelanggaran aktif`}
                  grade={ibadah.grade}
                />
                <div className="gap-2 grid grid-cols-3">
                  <Mini qid="ibadah" label="Pelanggaran" value={ibadah.count} />
                  <Mini qid="ibadah" label="Total poin" value={ibadah.pts} />
                  <Mini
                    qid="ibadah"
                    label="Hari bersih"
                    value={ibadah.cleanDays ?? "—"}
                  />
                </div>
                {Object.keys(ibadah.byPrayer).length > 0 && (
                  <Block title="Waktu shalat bermasalah">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ibadah.byPrayer).map(([k, n]) => (
                        <span
                          key={k}
                          className="bg-tint px-3 py-1 rounded-full font-extrabold text-brand-dim text-xs capitalize">
                          {k} · {n}×
                        </span>
                      ))}
                    </div>
                  </Block>
                )}
                <Block title="Riwayat">
                  <RecList
                    qid="ibadah"
                    icon={BookOpenCheck}
                    items={ibadah.list}
                    empty="Belum ada pelanggaran ibadah. Alhamdulillah!"
                  />
                </Block>
              </>
            )}

            {/* ---------- Riyadhah ---------- */}
            {tab === "riyadhah" && (
              <>
                <Banner
                  qid="riyadhah"
                  label="Skor riyadhah"
                  value={riyadhah.score}
                  sub={riyadhah.team ? `Tim ${riyadhah.team}` : "Tim: -"}
                  grade={riyadhah.grade}
                />
                <div className="gap-2 grid grid-cols-2">
                  <Mini
                    qid="riyadhah"
                    label="Pelanggaran"
                    value={riyadhah.count}
                  />
                  <Mini
                    qid="riyadhah"
                    label="Total poin"
                    value={riyadhah.pts}
                  />
                </div>
                <Block title="Riwayat">
                  <RecList
                    qid="riyadhah"
                    icon={Volleyball}
                    items={riyadhah.list}
                    empty="Belum ada pelanggaran riyadhah."
                  />
                </Block>
              </>
            )}

            {/* ---------- Nadzhofah ---------- */}
            {tab === "nadzhofah" && (
              <>
                <Banner
                  qid="nadzhofah"
                  label="Skor nadzhofah"
                  value={nadzhofah.score}
                  sub="Kebersihan & kerapian"
                  grade={nadzhofah.grade}
                />
                <div className="gap-2 grid grid-cols-3">
                  <Mini
                    qid="nadzhofah"
                    label="Nyeker"
                    value={`${nadzhofah.nyeker}×`}
                  />
                  <Mini
                    qid="nadzhofah"
                    label="Denda"
                    value={rupiah(nadzhofah.fines)}
                  />
                  <Mini
                    qid="nadzhofah"
                    label="Baju disita"
                    value={nadzhofah.clothing}
                  />
                </div>
                <Block title="Riwayat">
                  {nadzhofah.nyekerList.length +
                    nadzhofah.clothingList.length ===
                  0 ? (
                    <Good text="Catatan nadzhofah bersih. Bagus!" />
                  ) : (
                    <div className="space-y-2">
                      {nadzhofah.nyekerList.map((n) => (
                        <Rec
                          key={`n${n.id}`}
                          qid="nadzhofah"
                          icon={Shirt}
                          title="Nyeker"
                          sub={[dayLabel(n.nyeker_date), n.note]
                            .filter(Boolean)
                            .join(" · ")}
                          right={n.fine_amount ? rupiah(n.fine_amount) : null}
                        />
                      ))}
                      {nadzhofah.clothingList.map((c) => (
                        <Rec
                          key={`c${c.id}`}
                          qid="nadzhofah"
                          icon={Shirt}
                          title="Pakaian disita"
                          sub={[dayLabel(c.created_at), c.note]
                            .filter(Boolean)
                            .join(" · ")}
                          right={`${c.quantity ?? 1} pcs`}
                        />
                      ))}
                    </div>
                  )}
                </Block>
              </>
            )}

            {/* ---------- Lughah ---------- */}
            {tab === "lughah" && (
              <>
                {lughah === undefined ? (
                  <LoadingState rows={3} />
                ) : !lg.has ? (
                  <div className="flex flex-col items-center gap-1 bg-card px-6 py-8 border-2 border-line rounded-[20px] text-center">
                    <Mascot mood="read" size={84} className="animate-float" />
                    <p className="font-extrabold text-fg-2 text-sm">
                      Nilai & kelengkapan Lughah belum tersedia.
                    </p>
                    <p className="font-semibold text-fg-3 text-xs">
                      Data akan muncul setelah Qism Lughah menginputnya.
                    </p>
                  </div>
                ) : (
                  <>
                    <Banner
                      qid="lughah"
                      label={lg.periodName ?? "Nilai ujian"}
                      value={lg.score ?? "—"}
                      sub={
                        lg.score == null
                          ? "Belum dinilai"
                          : "Nilai ujian Lughah"
                      }
                      grade={lg.grade}
                    />
                    <div
                      className="bg-card border-2 border-line rounded-[20px] overflow-hidden"
                      style={{ boxShadow: "0 4px 0 var(--color-line)" }}>
                      <div className="flex justify-between items-center px-4 py-3 border-line border-b-2">
                        <p
                          className="font-display text-fg text-sm"
                          style={head}>
                          Kelengkapan ujian
                        </p>
                        {lg.complete ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 px-2.5 py-1 rounded-full font-black text-[11px] text-emerald-700">
                            <CheckCircle2 size={12} /> Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-full font-black text-[11px] text-amber-700">
                            <AlertTriangle size={12} /> Belum lengkap
                          </span>
                        )}
                      </div>
                      <ul className="divide-y divide-line">
                        {lg.items.map((it) => (
                          <li
                            key={it.key}
                            className="flex items-center gap-3 px-4 py-3">
                            <span
                              className={`grid size-7 place-items-center rounded-lg ${it.ok ? "bg-emerald-100 text-emerald-700" : "bg-soft-2 text-fg-4"}`}>
                              {it.ok ? (
                                <Check size={15} strokeWidth={3} />
                              ) : (
                                <X size={15} strokeWidth={3} />
                              )}
                            </span>
                            <span
                              className={`text-sm font-extrabold ${it.ok ? "text-fg" : "text-fg-3"}`}>
                              {it.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ---------- Rekapan OSIS ---------- */}
            {tab === "rekap" && (
              <>
                <div
                  className="flex items-center gap-3 bg-card p-4 border-2 border-line rounded-[20px]"
                  style={{ boxShadow: "0 4px 0 var(--color-line)" }}>
                  <Mascot mood="read" size={60} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-fg text-base" style={head}>
                      Rekapan OSIS {first}
                    </p>
                    <p className="font-semibold text-fg-3 text-xs">
                      Periode: {model.periodLabel}. Ubah periode di atas, lalu
                      unduh.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  icon={Download}
                  onClick={download}>
                  Unduh rekapan OSIS (PDF)
                </Button>
                <p className="px-1 font-semibold text-[11px] text-fg-3 text-center">
                  Pada jendela cetak, pilih <b>Simpan sebagai PDF</b>{" "}
                  (Android/Chrome: “Simpan ke PDF”).
                </p>
                <PaperFit>
                  <ReportCard model={model} printedAt={printedAt} />
                </PaperFit>
              </>
            )}

            {/* ---------- Pesan ---------- */}
            {tab === "pesan" && <Chat email={email} />}
          </div>
        </main>
      </div>

      {/* versi cetak — di luar root supaya tampil saat print */}
      {createPortal(
        <div className="print-only">
          <div className="print-doc rekap-doc">
            <ReportCard model={model} printedAt={printedAt} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
