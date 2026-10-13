import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { bkService } from "../../services/bkService";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { ArticleBlocks } from "../bk/ArticlesPage";

const CATS = ["Umum", "Perasaan", "Belajar", "Pertemanan", "Keluarga", "Ibadah"].map((c) => ({ value: c, label: c }));
const BLOCKS = [
  { type: "h2", label: "Judul bagian" },
  { type: "p", label: "Paragraf" },
  { type: "quote", label: "Kutipan" },
  { type: "image", label: "Gambar" },
];
const empty = { title: "", excerpt: "", category: "Umum", cover_url: null, blocks: [], is_published: false };

function ArticleEditor({ open, onClose, initial, onSaved }) {
  const { push } = useToast();
  const [a, setA] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const coverRef = useRef(null);

  useEffect(() => {
    if (open) { setA(initial ?? empty); setPreview(false); }
  }, [open, initial]);

  const set = (p) => setA((s) => ({ ...s, ...p }));
  const setBlock = (i, p) => set({ blocks: a.blocks.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= a.blocks.length) return;
    const bl = [...a.blocks];
    [bl[i], bl[j]] = [bl[j], bl[i]];
    set({ blocks: bl });
  };

  const upload = async (file, apply) => {
    if (!file) return;
    try { apply(await bkService.uploadImage(file)); }
    catch (e) { push("error", "Gagal mengunggah gambar", e.message); }
  };

  const save = async () => {
    if (!a.title.trim()) return push("error", "Judul wajib diisi");
    setBusy(true);
    try {
      await bkService.saveArticle({ ...a, title: a.title.trim() });
      push("success", "Artikel tersimpan");
      onSaved(); onClose();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" title={initial ? "Ubah artikel" : "Artikel baru"}>
      <div className="space-y-4">
        <Field label="Judul" required>
          <Input value={a.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Ringkasan singkat">
          <Textarea rows={2} value={a.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} />
        </Field>
        <div className="gap-3 grid sm:grid-cols-2">
          <Field label="Kategori">
            <Select options={CATS} value={a.category} onChange={(e) => set({ category: e.target.value })} />
          </Field>
          <Field label="Gambar header (maks. 3 MB)">
            <input ref={coverRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files[0], (url) => set({ cover_url: url }))} />
            <Button className="w-full" icon={ImagePlus} onClick={() => coverRef.current?.click()}>
              {a.cover_url ? "Ganti gambar" : "Unggah gambar"}
            </Button>
          </Field>
        </div>
        {a.cover_url && (
          <div className="relative">
            <img src={a.cover_url} alt="" className="border-2 border-line rounded-2xl w-full max-h-48 object-cover" />
            <Button size="sm" className="top-2 right-2 absolute" onClick={() => set({ cover_url: null })}>Hapus</Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="font-bold text-fg-2 text-xs">Isi artikel</p>
          <Button size="sm" variant="ghost" icon={preview ? EyeOff : Eye} onClick={() => setPreview((v) => !v)}>
            {preview ? "Kembali ke editor" : "Pratinjau"}
          </Button>
        </div>

        {preview ? (
          <div className="bg-card p-4 border-2 border-line rounded-2xl"><ArticleBlocks blocks={a.blocks} /></div>
        ) : (
          <>
            <div className="space-y-2.5">
              {a.blocks.map((b, i) => (
                <div key={i} className="bg-soft p-3 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>{BLOCKS.find((x) => x.type === b.type)?.label}</Badge>
                    <div className="flex">
                      <Button size="sm" variant="ghost" aria-label="Naik" icon={ArrowUp} onClick={() => move(i, -1)} />
                      <Button size="sm" variant="ghost" aria-label="Turun" icon={ArrowDown} onClick={() => move(i, 1)} />
                      <Button size="sm" variant="ghost" aria-label="Hapus blok" icon={Trash2} onClick={() => set({ blocks: a.blocks.filter((_, j) => j !== i) })} />
                    </div>
                  </div>
                  {b.type === "h2" && <Input value={b.text ?? ""} onChange={(e) => setBlock(i, { text: e.target.value })} />}
                  {(b.type === "p" || b.type === "quote") && <Textarea rows={b.type === "p" ? 4 : 2} value={b.text ?? ""} onChange={(e) => setBlock(i, { text: e.target.value })} />}
                  {b.type === "image" && (
                    <div className="space-y-2">
                      {b.url ? <img src={b.url} alt="" className="rounded-xl max-h-40" /> : null}
                      <label className="inline-block">
                        <input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files[0], (url) => setBlock(i, { url }))} />
                        <span className="inline-flex items-center gap-1.5 bg-card px-3 py-2 border-2 border-line rounded-xl font-bold text-sm cursor-pointer">
                          <ImagePlus size={15} /> {b.url ? "Ganti" : "Pilih gambar"}
                        </span>
                      </label>
                      <Input placeholder="Keterangan gambar (opsional)" value={b.caption ?? ""} onChange={(e) => setBlock(i, { caption: e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {BLOCKS.map((t) => (
                <Button key={t.type} size="sm" icon={Plus} onClick={() => set({ blocks: [...a.blocks, { type: t.type, text: "" }] })}>
                  {t.label}
                </Button>
              ))}
            </div>
          </>
        )}

        <label className="flex items-center gap-2 font-bold text-fg-2 text-sm">
          <input type="checkbox" checked={a.is_published} onChange={(e) => set({ is_published: e.target.checked })} />
          Terbitkan (terlihat oleh santri)
        </label>

        <div className="flex sm:flex-row flex-col-reverse sm:justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={busy} onClick={save}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function BkArticlesAdmin() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState({ open: false, a: null });

  const load = useCallback(() =>
    bkService.listArticles().then(setItems).catch((e) => { push("error", "Gagal memuat", e.message); setItems([]); }), [push]);
  useEffect(() => { load(); }, [load]);

  const open = async (row) => {
    if (!row) return setEdit({ open: true, a: null });
    try { setEdit({ open: true, a: await bkService.getArticle(row.id) }); }
    catch (e) { push("error", "Gagal membuka artikel", e.message); }
  };
  const remove = async (a) => {
    if (!(await confirm({ tone: "danger", title: "Hapus artikel?", message: `"${a.title}" akan dihapus permanen.`, confirmText: "Hapus" }))) return;
    try { await bkService.deleteArticle(a.id); push("success", "Artikel dihapus"); load(); }
    catch (e) { push("error", "Gagal menghapus", e.message); }
  };

  if (!items) return <LoadingState rows={3} />;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Artikel BK" description="Tulis bacaan dengan gambar, judul bagian, dan kutipan."
        actions={<Button variant="primary" icon={Plus} onClick={() => open(null)}>Artikel baru</Button>} />
      {items.length === 0 ? (
        <EmptyState title="Belum ada artikel" description="Mulai dengan artikel pertama." />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-3">
              {a.cover_url ? <img src={a.cover_url} alt="" className="rounded-xl size-16 object-cover" /> : <div className="bg-tint rounded-xl size-16" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-fg truncate">{a.title}</h3>
                <div className="flex gap-1.5 mt-1"><Badge tone="brand">{a.category}</Badge><Badge tone={a.is_published ? "emerald" : "neutral"}>{a.is_published ? "Terbit" : "Draf"}</Badge></div>
              </div>
              <Button variant="ghost" size="sm" aria-label="Ubah" icon={Pencil} onClick={() => open(a)} />
              <Button variant="ghost" size="sm" aria-label="Hapus" icon={Trash2} onClick={() => remove(a)} />
            </Card>
          ))}
        </div>
      )}
      <ArticleEditor open={edit.open} initial={edit.a} onClose={() => setEdit({ open: false, a: null })} onSaved={load} />
    </div>
  );
}
