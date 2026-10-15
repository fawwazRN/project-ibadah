import { useCallback, useEffect, useMemo, useState } from "react";
import { BookA, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { lughahService } from "../../services/lughahService";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { pickRandomPresentationVocab, readPresentationVocabOverride, savePresentationVocabOverride } from "../../lib/lughah";

const LEVELS = [
  { value: "pemula", label: "Pemula" },
  { value: "menengah", label: "Menengah" },
  { value: "sulit", label: "Sulit" },
];
const TYPES = [
  { value: "ism", label: "Ism" },
  { value: "fiil", label: "Fiil" },
];
const FIIL_FIELDS = [
  ["fiil_mudhari", "Fiil Mudhari", "يَكْتُبُ"],
  ["fiil_amr", "Fiil Amr", "اُكْتُبْ"],
  ["isim_fail", "Fail (pelaku)", "كَاتِبٌ"],
  ["isim_maful", "Maful (objek)", "مَكْتُوبٌ"],
];
// harakat, tatwil, dan spasi diabaikan agar "كِتَابٌ" dan "كتاب" dianggap sama
const normAr = (t = "") => t.replace(/[\u064B-\u065F\u0670\u0640\s]/g, "");
const normTxt = (t = "") => normAr(t).toLowerCase();
const LEVEL_LABEL = { pemula: "Pemula", menengah: "Menengah", sulit: "Sulit" };
const GROUPS = [
  { value: "level_theme", label: "Per tingkat → per tema" },
  { value: "theme", label: "Per tema saja" },
  { value: "level", label: "Per tingkat saja" },
  { value: "type", label: "Per jenis kata" },
  { value: "none", label: "Tanpa kelompok" },
];
const NO_THEME = "Tanpa tema";
const EMPTY = { arabic: "", jama: "", meaning: "", mufidah_text: "", mufidah_meaning: "", level: "pemula", theme: "", word_type: "ism", fiil_mudhari: "", fiil_amr: "", isim_fail: "", isim_maful: "" };

export default function MufrodatPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [groupBy, setGroupBy] = useState("level_theme");
  const [presentationVocab, setPresentationVocab] = useState(readPresentationVocabOverride);

  const load = useCallback(() => {
    lughahService.listVocab().then(setRows).catch(setError);
  }, []);
  useEffect(load, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const reshufflePresentationVocab = () => {
    const selected = pickRandomPresentationVocab(rows, presentationVocab ?? []);
    if (!selected.length) {
      push("info", "Belum ada mufrodat aktif", "Aktifkan mufrodat di setiap tingkat terlebih dahulu.");
      return;
    }
    try {
      savePresentationVocabOverride(selected);
      setPresentationVocab(selected);
      push("success", "Mufrodat slide diacak ulang", "Pilihan ini berlaku sampai besok atau diacak ulang.");
    } catch (err) {
      push("error", "Gagal mengacak mufrodat slide", err.message);
    }
  };

  const dup = useMemo(() => {
    const k = normAr(form.arabic);
    return k ? (rows ?? []).find((r) => r.id !== editId && normAr(r.arabic) === k) : null;
  }, [rows, form.arabic, editId]);

  const themes = useMemo(() => [...new Set((rows ?? []).map((r) => r.theme).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [rows]);

  const groups = useMemo(() => {
    const needle = normTxt(q.trim());
    const list = (rows ?? []).filter((r) => !needle || normTxt([r.arabic, r.jama, r.meaning, r.theme, r.mufidah_text, r.mufidah_meaning, r.fiil_mudhari, r.fiil_amr, r.isim_fail, r.isim_maful].filter(Boolean).join(" ")).includes(needle));
    const byTheme = (rs) => {
      const names = [...new Set(rs.map((r) => r.theme || NO_THEME))].sort((a, b) => (a === NO_THEME) - (b === NO_THEME) || a.localeCompare(b));
      return names.map((t) => ({ t, rows: rs.filter((r) => (r.theme || NO_THEME) === t) }));
    };
    const flat = (title, rs) => ({ k: title, title, count: rs.length, sections: [{ t: null, rows: rs }] });
    let items;
    if (groupBy === "level_theme" || groupBy === "level") {
      items = ["pemula", "menengah", "sulit"].map((k) => {
        const rs = list.filter((r) => (r.level ?? "pemula") === k);
        return { k, title: LEVEL_LABEL[k], count: rs.length, sections: groupBy === "level" ? [{ t: null, rows: rs }] : byTheme(rs) };
      });
    } else if (groupBy === "theme") {
      items = byTheme(list).map((g) => flat(g.t, g.rows));
    } else if (groupBy === "type") {
      items = [["ism", "Ism"], ["fiil", "Fiil"]].map(([k, t]) => flat(t, list.filter((r) => (r.word_type ?? "ism") === k)));
    } else items = [flat("Semua mufrodat", list)];
    return { total: list.length, items: items.filter((g) => g.count) };
  }, [rows, q, groupBy]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.arabic.trim() || !form.meaning.trim() || dup) return;
    setBusy(true);
    try {
      await lughahService.saveVocab(editId, {
        arabic: form.arabic.trim(),
        jama: form.word_type === "ism" ? form.jama.trim() || null : null,
        meaning: form.meaning.trim(),
        level: form.level,
        theme: form.theme.trim() || null,
        word_type: form.word_type,
        ...Object.fromEntries(FIIL_FIELDS.map(([k]) => [k, form.word_type === "fiil" ? form[k].trim() || null : null])),
        mufidah_text: form.mufidah_text.trim() || null,
        mufidah_meaning: form.mufidah_meaning.trim() || null,
      });
      push("success", editId ? "Mufrodat diperbarui" : "Mufrodat ditambahkan", form.arabic);
      setForm(EMPTY); setEditId(null); load();
    } catch (err) {
      push("error", "Gagal menyimpan", err.code === "23505" ? "Mufrodat ini sudah terdaftar." : err.message);
    } finally { setBusy(false); }
  };

  const toggle = async (r) => {
    try {
      await lughahService.saveVocab(r.id, { is_active: !r.is_active });
      load();
    } catch (err) { push("error", "Gagal", err.message); }
  };

  const remove = async (r) => {
    const ok = await confirm({
      title: "Hapus mufrodat?", message: `“${r.arabic}” akan dihapus.`,
      confirmText: "Ya, hapus", tone: "danger",
    });
    if (!ok) return;
    try { await lughahService.removeVocab(r.id); load(); }
    catch (err) { push("error", "Gagal menghapus", err.message); }
  };

  if (error) return <ErrorState error={error} />;
  if (!rows) return <LoadingState />;

  return (
    <div className="space-y-4">
      <PageHeader icon={BookA} title="Mufrodat Harian"
        description="Tambahkan banyak mufrodat beserta jumlah mufidah (kalimat contoh) dan artinya. Setiap hari 1 mufrodat acak per tingkat (pemula, menengah, sulit) tampil di presentasi." />
      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-fg">Mufrodat untuk slide presentasi</p>
            <p className="text-sm text-fg-3">
              {presentationVocab?.length
                ? presentationVocab.map((row) => `${LEVEL_LABEL[row.level] ?? "Pemula"}: ${row.arabic}`).join(" · ")
                : "Gunakan pilihan harian atau acak pilihan baru."}
            </p>
          </div>
          <Button type="button" icon={RefreshCw} onClick={reshufflePresentationVocab}>
            Acak ulang untuk slide
          </Button>
        </div>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 items-end">
          <label className="text-sm">Tingkat
            <Select options={LEVELS} value={form.level} onChange={set("level")} />
          </label>
          <label className="text-sm">Tema (mis. kamar mandi)
            <Input list="mufrodat-themes" value={form.theme} onChange={set("theme")} placeholder="kamar mandi" />
            <datalist id="mufrodat-themes">{themes.map((t) => <option key={t} value={t} />)}</datalist>
          </label>
          <label className="text-sm">Jenis kata
            <Select options={TYPES} value={form.word_type} onChange={set("word_type")} />
          </label>
          <label className="text-sm">{form.word_type === "fiil" ? "Fiil Madhi (Arab)" : "Ism (Arab)"}
            <Input dir="rtl" lang="ar" value={form.arabic} onChange={set("arabic")} placeholder="كِتَابٌ" />
            {dup && <span className="mt-1 block text-xs font-semibold text-red-600">Sudah terdaftar: {dup.arabic} ({dup.meaning}). Tidak bisa didaftarkan lagi.</span>}
          </label>
          <label className="text-sm">Arti
            <Input value={form.meaning} onChange={set("meaning")} placeholder="Buku" />
          </label>
          {form.word_type === "ism" && (
            <label className="text-sm">Jama’ (Arab, opsional)
              <Input dir="rtl" lang="ar" value={form.jama} onChange={set("jama")} placeholder="كُتُبٌ" />
            </label>
          )}
          {form.word_type === "fiil" && FIIL_FIELDS.map(([k, label, ph]) => (
            <label key={k} className="text-sm">{label}
              <Input dir="rtl" lang="ar" value={form[k]} onChange={set(k)} placeholder={ph} />
            </label>
          ))}
          <label className="text-sm">Jumlah mufidah (kalimat contoh, Arab)
            <Input dir="rtl" lang="ar" value={form.mufidah_text} onChange={set("mufidah_text")} placeholder="هٰذَا كِتَابٌ جَدِيدٌ" />
          </label>
          <label className="text-sm">Arti kalimat
            <Input value={form.mufidah_meaning} onChange={set("mufidah_meaning")} placeholder="Ini adalah buku baru." />
          </label>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={busy} disabled={!!dup} icon={editId ? Pencil : Plus}>
              {editId ? "Simpan" : "Tambah"}
            </Button>
            {editId && <Button type="button" onClick={() => { setEditId(null); setForm(EMPTY); }}>Batal</Button>}
          </div>
        </form>
      </Card>
      <Card className="p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
            <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari mufrodat, arti, atau kalimat…" />
          </div>
          <Select options={GROUPS} value={groupBy} onChange={(e) => setGroupBy(e.target.value)} />
        </div>
        <p className="mt-2 text-xs text-fg-3">{groups.total} dari {rows.length} mufrodat{q ? " cocok dengan pencarian" : ""}</p>
      </Card>
      {rows.length === 0 && <Card><p className="p-6 text-center text-fg-3">Belum ada mufrodat.</p></Card>}
      {rows.length > 0 && groups.total === 0 && <Card><p className="p-6 text-center text-fg-3">Tidak ada yang cocok dengan “{q}”.</p></Card>}
      {groups.items.map((g) => (
        <div key={g.k} className="space-y-2">
          <p className="px-1 text-base font-extrabold text-fg">{g.title} <span className="text-sm font-normal text-fg-3">· {g.count}</span></p>
          {g.sections.map((sec) => (
            <div key={sec.t ?? "_"}>
              {sec.t && <p className="mb-1 px-1 text-sm font-bold text-fg-2">Tema: {sec.t} <span className="font-normal text-fg-3">· {sec.rows.length}</span></p>}
              <Card className="divide-y divide-line">
                {sec.rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3">
                    <span lang="ar" dir="rtl" className="text-2xl font-bold min-w-24">{r.arabic}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold">{r.meaning} <span className="text-xs font-normal text-fg-3">· {r.word_type === "fiil" ? "fiil" : "ism"} · {LEVEL_LABEL[r.level] ?? r.level}{r.theme ? ` · ${r.theme}` : ""}</span></p>
                    {r.jama && <p className="text-sm text-fg-3">Jama’: <span lang="ar" dir="rtl" className="font-semibold text-fg">{r.jama}</span></p>}
                    <p className="truncate text-sm text-fg-3"><span lang="ar" dir="rtl">{r.mufidah_text}</span>{r.mufidah_meaning ? ` — ${r.mufidah_meaning}` : ""}</p>
                    </div>
                    <Button size="sm" onClick={() => toggle(r)}>{r.is_active ? "Aktif" : "Nonaktif"}</Button>
                    <Button size="sm" icon={Pencil} aria-label="Ubah"
                      onClick={() => { setEditId(r.id); setForm({ arabic: r.arabic, jama: r.jama ?? "", meaning: r.meaning, mufidah_text: r.mufidah_text ?? "", mufidah_meaning: r.mufidah_meaning ?? "", level: r.level ?? "pemula", theme: r.theme ?? "", word_type: r.word_type ?? "ism", ...Object.fromEntries(FIIL_FIELDS.map(([k]) => [k, r[k] ?? ""])) }); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                    <Button size="sm" variant="dangerSoft" icon={Trash2} aria-label="Hapus" onClick={() => remove(r)} />
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
