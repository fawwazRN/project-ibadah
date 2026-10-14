import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Lock, LockOpen, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { calendarService } from "../../services/calendarService";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { BkMascot } from "../../components/ui/BkMascot";

export const QISM_META = {
  umum: { label: "Umum", q: "q-brand" },
  ibadah: { label: "Ibadah", q: "q-ibadah" },
  nadzhofah: { label: "Nadzhofah", q: "q-nadzhofah" },
  lughah: { label: "Lughah", q: "q-lughah" },
  riyadhah: { label: "Riyadhah", q: "q-riyadhah" },
};
const ROLE_QISM = { qism_ibadah: "ibadah", qism_riyadhah: "riyadhah", nadzhofah: "nadzhofah", lughah: "lughah" };
const DAYS = ["Jum", "Sab", "Ahd", "Sen", "Sel", "Rab", "Kam"]; // pekan madrasah: Jumat–Kamis
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => new Date(`${s}T00:00:00`);
const fmt = (s, o) => parse(s).toLocaleDateString("id-ID", o ?? { day: "numeric", month: "short" });
const blank = (date, qism) => ({ title: "", description: "", qism, start_date: date, end_date: date, start_time: "", location: "", locked: false });

export function QismDot({ qism }) {
  return <span className={`${QISM_META[qism]?.q ?? "q-brand"} inline-block size-2 rounded-full`} style={{ background: "var(--q)" }} />;
}

export default function CalendarPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const confirm = useConfirm();
  const role = profile?.role;
  const isSuper = role === "super_admin";
  const myQism = ROLE_QISM[role];

  const [events, setEvents] = useState(null);
  const [open, setOpen] = useState(true); // saklar admin: qism boleh mengedit
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [sel, setSel] = useState(iso(new Date()));
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, s] = await Promise.all([calendarService.list(), calendarService.getSettings()]);
      setEvents(e);
      setOpen(s.qism_can_edit);
    } catch {
      setEvents([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const canAdd = isSuper || (!!myQism && open);
  const canTouch = (ev) => isSuper || (!!myQism && open && !ev.locked);

  const cells = useMemo(() => {
    const first = new Date(month);
    const lead = (first.getDay() + 2) % 7; // Jumat = kolom pertama
    const start = new Date(first);
    start.setDate(1 - lead);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [month]);

  const onDay = useCallback((day) => (events ?? []).filter((e) => e.start_date <= day && day <= e.end_date), [events]);
  const today = iso(new Date());
  const upcoming = (events ?? []).filter((e) => e.end_date >= today).slice(0, 5);
  const selected = onDay(sel);

  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return push("error", "Judul wajib diisi");
    if (form.end_date && form.end_date < form.start_date) return push("error", "Tanggal selesai sebelum tanggal mulai");
    setBusy(true);
    try {
      await calendarService.save({ ...form, title: form.title.trim() }, profile?.id);
      push("success", form.id ? "Agenda diperbarui" : "Agenda ditambahkan");
      setSel(form.start_date);
      setForm(null);
      load();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message?.includes("policy") ? "Kalender sedang dikunci oleh admin." : e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ev) => {
    if (!(await confirm({ title: "Hapus agenda?", message: ev.title, confirmText: "Ya, hapus", tone: "danger" }))) return;
    try {
      await calendarService.remove(ev.id);
      push("success", "Agenda dihapus");
      load();
    } catch (e) {
      push("error", "Gagal menghapus", e.message);
    }
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    try {
      await calendarService.setQismCanEdit(next);
      push("info", next ? "Qism boleh mengedit kalender" : "Kalender dikunci untuk qism");
    } catch (e) {
      setOpen(!next);
      push("error", "Gagal mengubah pengaturan", e.message);
    }
  };

  if (!events) return <LoadingState rows={4} />;

  const EventRow = ({ ev }) => {
    const m = QISM_META[ev.qism] ?? QISM_META.umum;
    return (
      <li className={`${m.q} flex gap-3 p-3 rounded-2xl border-2 animate-fade-up`} style={{ background: "var(--q-tint)", borderColor: "var(--q-line)" }}>
        <span className="rounded-full w-1.5 shrink-0" style={{ background: "var(--q)" }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-extrabold text-fg text-sm truncate">{ev.title}</p>
            {ev.locked && <Lock size={12} className="text-fg-3 shrink-0" aria-label="Dikunci admin" />}
          </div>
          <p className="mt-0.5 font-bold text-xs" style={{ color: "var(--q-dim)" }}>
            {m.label} · {ev.start_date === ev.end_date ? fmt(ev.start_date) : `${fmt(ev.start_date)} – ${fmt(ev.end_date)}`}
          </p>
          {(ev.start_time || ev.location) && (
            <p className="flex flex-wrap items-center gap-x-3 mt-1 text-fg-3 text-xs">
              {ev.start_time && <span className="inline-flex items-center gap-1"><Clock size={12} />{ev.start_time.slice(0, 5)}</span>}
              {ev.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{ev.location}</span>}
            </p>
          )}
          {ev.description && <p className="mt-1.5 text-fg-2 text-sm leading-relaxed whitespace-pre-wrap">{ev.description}</p>}
        </div>
        {canTouch(ev) && (
          <div className="flex flex-col gap-1 shrink-0">
            <button aria-label="Ubah" onClick={() => setForm({ ...ev, start_time: ev.start_time?.slice(0, 5) ?? "", description: ev.description ?? "", location: ev.location ?? "" })} className="place-items-center grid hover:bg-white/70 rounded-lg size-8 text-fg-3"><Pencil size={15} /></button>
            <button aria-label="Hapus" onClick={() => remove(ev)} className="place-items-center grid hover:bg-white/70 rounded-lg size-8 text-rose-600"><Trash2 size={15} /></button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5 mx-auto max-w-3xl">
      <PageHeader
        icon={CalendarDays}
        title="Kalender OSIS"
        description={canAdd ? "Semua qism bisa menambah agenda. Admin punya keputusan akhir." : "Agenda kegiatan seluruh qism OSIS."}
        actions={canAdd && <Button variant="primary" icon={Plus} onClick={() => setForm(blank(sel, myQism ?? "umum"))}>Agenda</Button>}
      />

      {isSuper && (
        <Card className="flex items-center gap-3 p-3.5">
          <span className="place-items-center grid bg-tint rounded-xl size-10 text-brand-dim shrink-0">{open ? <LockOpen size={18} /> : <Lock size={18} />}</span>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-fg text-sm">{open ? "Qism boleh mengedit" : "Kalender dikunci untuk qism"}</p>
            <p className="text-fg-3 text-xs">Kunci agenda satu per satu lewat form agenda. Super Admin selalu bisa mengedit semuanya.</p>
          </div>
          <button type="button" role="switch" aria-checked={open} onClick={toggleOpen} className={`relative rounded-full w-12 h-7 transition-colors shrink-0 ${open ? "bg-brand" : "bg-line-2"}`}>
            <span className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ${open ? "translate-x-5" : ""}`} />
          </button>
        </Card>
      )}
      {!!myQism && !open && (
        <p className="bg-amber-50 px-3.5 py-2.5 border-2 border-amber-200 rounded-2xl font-bold text-amber-800 text-xs">Admin sedang mengunci kalender. Kamu hanya bisa melihat agenda.</p>
      )}

      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Bulan lalu" onClick={() => shift(-1)} className="place-items-center grid hover:bg-soft-2 rounded-xl size-9 active:scale-90 transition"><ChevronLeft size={20} /></button>
          <div className="text-center">
            <p key={month.getTime()} className="font-display font-black text-fg text-lg capitalize animate-fade-up">{month.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</p>
            <button onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(today); }} className="font-bold text-brand-dim text-[11px]">Hari ini</button>
          </div>
          <button aria-label="Bulan depan" onClick={() => shift(1)} className="place-items-center grid hover:bg-soft-2 rounded-xl size-9 active:scale-90 transition"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => <span key={d} className="py-1 font-bold text-[11px] text-fg-3 text-center uppercase">{d}</span>)}
        </div>
        <div className="gap-1 grid grid-cols-7">
          {cells.map((d) => {
            const k = iso(d);
            const evs = onDay(k);
            const inMonth = d.getMonth() === month.getMonth();
            const isSel = k === sel;
            return (
              <button
                key={k}
                onClick={() => setSel(k)}
                aria-label={`${fmt(k, { day: "numeric", month: "long" })}, ${evs.length} agenda`}
                aria-pressed={isSel}
                className={`flex flex-col items-center gap-1 rounded-xl py-1.5 min-h-[52px] transition active:scale-90 ${isSel ? "bg-brand text-on-brand shadow-md scale-105" : "hover:bg-soft-2"} ${inMonth ? "" : "opacity-35"}`}>
                <span className={`text-sm font-extrabold ${k === today && !isSel ? "grid place-items-center size-6 rounded-full bg-tint text-brand-dim" : ""}`}>{d.getDate()}</span>
                <span className="flex gap-0.5 h-2">
                  {evs.slice(0, 3).map((e) => (
                    <i key={e.id} className={`${QISM_META[e.qism]?.q ?? "q-brand"} size-1.5 rounded-full`} style={{ background: isSel ? "#fff" : "var(--q)" }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-line border-t">
          {Object.entries(QISM_META).map(([k, m]) => (
            <span key={k} className="inline-flex items-center gap-1.5 font-semibold text-[11px] text-fg-3"><QismDot qism={k} />{m.label}</span>
          ))}
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="px-1 font-extrabold text-fg text-base capitalize">{fmt(sel, { weekday: "long", day: "numeric", month: "long" })}</h2>
        {selected.length ? (
          <ul key={sel} className="space-y-2 stagger">{selected.map((e) => <EventRow key={e.id} ev={e} />)}</ul>
        ) : (
          <Card className="flex items-center gap-3 p-4">
            <BkMascot mood="peek" size={52} />
            <p className="text-fg-3 text-sm">Belum ada agenda di hari ini.{canAdd && " Ketuk Agenda untuk menambah."}</p>
          </Card>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 font-extrabold text-fg text-base">Mendatang</h2>
        {upcoming.length ? (
          <ul className="space-y-2 stagger">{upcoming.map((e) => <EventRow key={e.id} ev={e} />)}</ul>
        ) : (
          <EmptyState icon={CalendarDays} title="Belum ada agenda mendatang" description="Agenda baru dari semua qism akan muncul di sini." />
        )}
      </section>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? "Ubah agenda" : "Agenda baru"}>
        {form && (
          <div className="space-y-4">
            <Field label="Judul" required><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Rapat koordinasi qism" /></Field>
            <Field label="Qism">
              <Select value={form.qism} onChange={(e) => set("qism", e.target.value)} options={Object.entries(QISM_META).map(([value, m]) => ({ value, label: m.label }))} />
            </Field>
            <div className="gap-3 grid grid-cols-2">
              <Field label="Mulai" required><Input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value, end_date: f.end_date < e.target.value ? e.target.value : f.end_date }))} /></Field>
              <Field label="Selesai"><Input type="date" min={form.start_date} value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></Field>
            </div>
            <div className="gap-3 grid grid-cols-2">
              <Field label="Jam (opsional)"><Input type="time" value={form.start_time ?? ""} onChange={(e) => set("start_time", e.target.value)} /></Field>
              <Field label="Tempat (opsional)"><Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Aula" /></Field>
            </div>
            <Field label="Keterangan"><Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
            {isSuper && (
              <label className="flex items-center gap-2.5 font-bold text-fg-2 text-sm">
                <input type="checkbox" checked={form.locked} onChange={(e) => set("locked", e.target.checked)} />
                <Lock size={14} /> Kunci agenda (hanya Super Admin yang bisa ubah)
              </label>
            )}
            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={() => setForm(null)}>Batal</Button>
              <Button variant="primary" className="flex-1" loading={busy} onClick={save}>Simpan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
