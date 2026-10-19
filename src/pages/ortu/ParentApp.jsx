// Portal Orang Tua — /ortu. Tanpa akun: cukup email anak (santri) → progres muncul.
// 4 tab: Ibadah, Riyadhah, Nadzhofah, Lughah + Pesan (disaring AI).
import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const KEY = "ortu.email";
const box = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500";
const btn = "rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50";
const day = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "");
const Empty = ({ text }) => <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">{text}</p>;
const Row = ({ title, sub, right }) => (
  <div className="flex items-center gap-3 rounded-xl bg-white p-3">
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{title}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
    {right && <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{right}</span>}
  </div>
);
const Total = ({ label, value }) => (
  <div className="rounded-2xl bg-emerald-600 p-4 text-white"><p className="text-xs opacity-80">{label}</p><p className="text-3xl font-black">{value}</p></div>
);

function Violations({ list, scope, emptyText }) {
  const rows = list.filter((v) => (v.rule?.scope ?? "ibadah") === scope);
  const pts = rows.reduce((a, v) => a + (v.rule?.points ?? 0), 0);
  return (
    <div className="space-y-2">
      <Total label="Total poin pelanggaran" value={pts} />
      {rows.length === 0 ? <Empty text={emptyText} /> : rows.map((v) => (
        <Row key={v.id} title={v.rule?.name ?? "Pelanggaran"} sub={[day(v.created_at), v.note].filter(Boolean).join(" · ")} right={`${v.rule?.points ?? 0} poin`} />
      ))}
    </div>
  );
}

function Chat({ email }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    const { data } = await supabase.rpc("parent_messages_list", { p_email: email });
    setMsgs(data ?? []);
  }, [email]);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  const send = async (e) => {
    e.preventDefault();
    const body = text.trim(); if (!body || busy) return;
    setBusy(true); setNote("");
    const { data, error } = await supabase.functions.invoke("parent-message", { body: { email, body } });
    setBusy(false);
    if (error || data?.error) return setNote(data?.error ?? error.message);
    if (data.status === "blocked") setNote(`Pesan diblokir AI: ${data.reason}`); else setText("");
    load();
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Pesan hanya untuk nasihat & pembinaan. Pesan di luar itu diblokir AI dan tidak sampai ke anak.</p>
      {msgs.map((m) => (
        <div key={m.id} className={`rounded-2xl px-3 py-2 text-sm ${m.status === "sent" ? "bg-emerald-100" : "border border-red-200 bg-red-50"}`}>
          <p>{m.body}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            {m.status === "sent" ? "Terkirim" : <><ShieldAlert size={12} className="text-red-500" /> Diblokir: {m.reason}</>}
          </p>
        </div>
      ))}
      {note && <p className="text-sm font-semibold text-red-600">{note}</p>}
      <form onSubmit={send} className="flex gap-2">
        <input className={box} maxLength={1000} placeholder="Tulis nasihat untuk anak…" value={text} onChange={(e) => setText(e.target.value)} />
        <button className={btn} disabled={busy} aria-label="Kirim">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}</button>
      </form>
    </div>
  );
}

const TABS = [["ibadah", "Ibadah"], ["riyadhah", "Riyadhah"], ["nadzhofah", "Nadzhofah"], ["lughah", "Lughah"], ["pesan", "Pesan"]];

export default function ParentApp() {
  const [email, setEmail] = useState(() => localStorage.getItem(KEY) ?? "");
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("ibadah");

  const load = useCallback(async (em) => {
    setBusy(true); setErr("");
    const { data: d, error } = await supabase.rpc("parent_view", { p_email: em });
    setBusy(false);
    if (error) { setErr(error.message); localStorage.removeItem(KEY); setEmail(""); return; }
    localStorage.setItem(KEY, em); setEmail(em); setData(d);
  }, []);
  useEffect(() => { if (email && !data) load(email); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center bg-emerald-50/50 p-4">
        <form onSubmit={(e) => { e.preventDefault(); load(input.trim()); }} className="w-full max-w-sm space-y-3">
          <h1 className="text-2xl font-black text-emerald-800">Portal Orang Tua</h1>
          <p className="text-sm text-slate-600">Masukkan email akun anak (santri) untuk melihat perkembangannya.</p>
          <input className={box} type="email" required placeholder="email.anak@gmail.com" value={input} onChange={(e) => setInput(e.target.value)} />
          {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
          <button className={`${btn} w-full`} disabled={busy}>{busy ? "Memuat…" : "Lihat perkembangan"}</button>
        </form>
      </div>
    );
  }
  const s = data.student;
  const clothingQty = (data.clothing ?? []).reduce((a, c) => a + (c.quantity ?? 1), 0);
  return (
    <div className="min-h-screen bg-emerald-50/40">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <div className="min-w-0 flex-1"><p className="truncate font-black text-emerald-800">{s.full_name}</p><p className="text-xs text-slate-500">{s.class_name}</p></div>
        <button className="text-sm font-semibold text-slate-500 underline" onClick={() => { localStorage.removeItem(KEY); setData(null); setEmail(""); }}>Ganti anak</button>
      </header>
      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b bg-white px-2 py-2">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold ${tab === id ? "bg-emerald-600 text-white" : "text-slate-600"}`}>{label}</button>
        ))}
      </nav>
      <main className="mx-auto max-w-3xl space-y-2 p-4">
        {tab === "ibadah" && <Violations list={data.violations ?? []} scope="ibadah" emptyText="Belum ada pelanggaran ibadah. Alhamdulillah!" />}
        {tab === "riyadhah" && (<>
          <Row title="Tim futsal" sub="Tim yang diikuti musim ini" right={data.team?.name ?? "Belum masuk tim"} />
          <Violations list={data.violations ?? []} scope="riyadhah" emptyText="Belum ada pelanggaran riyadhah." />
        </>)}
        {tab === "nadzhofah" && (<>
          <div className="grid grid-cols-2 gap-2"><Total label="Kali nyeker" value={(data.nyeker ?? []).length} /><Total label="Baju disita" value={clothingQty} /></div>
          {(data.nyeker ?? []).map((n) => <Row key={n.id} title="Nyeker" sub={[day(n.nyeker_date), n.note].filter(Boolean).join(" · ")} right={n.fine_amount ? `Rp${Number(n.fine_amount).toLocaleString("id-ID")}` : null} />)}
          {(data.clothing ?? []).map((c) => <Row key={c.id} title="Pakaian disita" sub={[day(c.created_at), c.note].filter(Boolean).join(" · ")} right={`${c.quantity ?? 1} pcs`} />)}
          {!(data.nyeker?.length || data.clothing?.length) && <Empty text="Catatan nadzhofah bersih. Bagus!" />}
        </>)}
        {tab === "lughah" && <Empty text="Nilai & kelengkapan Lughah segera hadir." />}
        {tab === "pesan" && <Chat email={email} />}
      </main>
    </div>
  );
}
