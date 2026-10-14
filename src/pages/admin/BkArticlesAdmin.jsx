import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Check, Eye, EyeOff, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Loader2,
  Pencil, Plus, Quote, Redo2, RemoveFormatting, Trash2, Underline, Undo2, UploadCloud,
} from "lucide-react";
import { bkService } from "../../services/bkService";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { ArticleBlocks } from "../bk/ArticlesPage";
import { sanitizeArticleHtml } from "../../lib/articleContent";

const CATS = ["Umum", "Perasaan", "Belajar", "Pertemanan", "Keluarga", "Ibadah"];
const empty = { title: "", excerpt: "", category: "Umum", cover_url: null, blocks: [], is_published: false, html: "" };

const esc = (v = "") => v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const textOf = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const hasContent = (html = "") => !!textOf(html) || /<img/i.test(html);
const uid = () => Math.random().toString(36).slice(2, 9);
const imageFiles = (list) => Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

// Artikel lama (banyak blok) dibuka sebagai satu dokumen; disimpan sebagai satu blok HTML.
function blocksToHtml(blocks = []) {
  return blocks
    .map((b) => {
      if (b.type === "h2") return `<h2>${esc(b.text ?? "")}</h2>`;
      if (b.type === "quote") return `<blockquote>${sanitizeArticleHtml(b.text ?? "")}</blockquote>`;
      if (b.type === "image" && b.url)
        return `<figure><img src="${esc(b.url)}" alt="${esc(b.caption ?? "")}">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
      return `<div>${sanitizeArticleHtml(b.text ?? "")}</div>`;
    })
    .join("");
}

function ToolBtn({ icon: Icon, label, onClick }) {
  return (
    <button type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="place-items-center grid hover:bg-tint rounded-lg size-9 text-fg-2 hover:text-brand-dim transition-colors">
      <Icon size={17} />
    </button>
  );
}
const Sep = () => <span className="bg-line mx-1 w-px h-5" aria-hidden="true" />;

// ---------- Editor isi: satu dokumen, paste/drop gambar & gaya langsung jalan ----------
function BodyEditor({ html, onChange, onBusy }) {
  const { push } = useToast();
  const ref = useRef(null);
  const last = useRef(null);
  const pending = useRef(0);
  const internalDrag = useRef(false);
  const fileRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(!hasContent(html));
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!ref.current || html === last.current) return;
    ref.current.innerHTML = sanitizeArticleHtml(html);
    setIsEmpty(!hasContent(html));
  }, [html]);

  const update = () => {
    const h = sanitizeArticleHtml(ref.current?.innerHTML ?? "");
    last.current = h;
    setIsEmpty(!hasContent(h) && !ref.current?.querySelector("img"));
    onChange(h);
  };
  const exec = (cmd, val) => { ref.current?.focus(); document.execCommand(cmd, false, val); update(); };
  const toggleQuote = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const quote = element?.closest("blockquote");
    if (!quote) return exec("formatBlock", "blockquote");
    quote.replaceWith(...Array.from(quote.childNodes));
    update();
  };
  const exitEmptyQuote = (e) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const selection = window.getSelection();
    if (!selection?.isCollapsed || !selection.anchorNode) return;

    const node = selection.anchorNode;
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    const quote = element?.closest("blockquote");
    if (!quote) return;

    let line = element;
    while (line?.parentElement && line.parentElement !== quote) line = line.parentElement;
    const caretAtQuoteEnd = (() => {
      const end = document.createRange();
      end.selectNodeContents(quote);
      end.collapse(false);
      return selection.getRangeAt(0).compareBoundaryPoints(Range.START_TO_START, end) === 0;
    })();
    const trailingBreak = caretAtQuoteEnd && quote.lastChild?.nodeName === "BR";
    if (line && line !== quote && (line.textContent ?? "").trim()) return;
    if (line === quote && quote.textContent.trim() && !trailingBreak) return;
    if (line !== quote && line?.querySelector("img")) return;
    let following = line?.nextSibling;
    while (following) {
      if ((following.textContent ?? "").trim() || (following.nodeType === Node.ELEMENT_NODE && following.querySelector("img"))) return;
      following = following.nextSibling;
    }

    e.preventDefault();
    const paragraph = document.createElement("p");
    paragraph.append(document.createElement("br"));
    quote.after(paragraph);
    if (line && line !== quote) line.remove();
    if (trailingBreak) quote.lastChild?.remove();
    if (!quote.textContent.trim() && !quote.querySelector("img")) quote.remove();
    const range = document.createRange();
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    update();
  };
  const run = async (fn) => {
    pending.current += 1; onBusy(true);
    try { await fn(); } finally { pending.current -= 1; onBusy(pending.current > 0); }
  };

  // Unggah di latar belakang; gambar sementara tampil langsung dengan penanda data-up
  const host = (id, file, keepOnFail) => run(async () => {
    const find = () => ref.current?.querySelector(`img[data-up="${id}"]`);
    try {
      const url = await bkService.uploadImage(file);
      const img = find();
      if (img) { img.src = url; img.removeAttribute("data-up"); img.removeAttribute("style"); }
    } catch (e) {
      const img = find();
      if (keepOnFail) img?.removeAttribute("data-up"); else img?.remove();
      push("error", "Gambar gagal diunggah", e.message);
    }
    update();
  });

  const insertFiles = (files) => {
    ref.current?.focus();
    files.forEach((file) => {
      const id = uid();
      document.execCommand("insertHTML", false, `<img data-up="${id}" src="${URL.createObjectURL(file)}" alt="" style="opacity:.55">`);
      setIsEmpty(false);
      host(id, file, false);
    });
  };

  const insertHtml = (raw) => {
    const box = document.createElement("div");
    box.innerHTML = sanitizeArticleHtml(raw);
    const jobs = Array.from(box.querySelectorAll("img")).map((img) => {
      const id = uid();
      img.setAttribute("data-up", id);
      return { id, src: img.getAttribute("src") };
    });
    ref.current?.focus();
    document.execCommand("insertHTML", false, box.innerHTML);
    setIsEmpty(false);
    update();
    // Simpan salinan gambar ke server (anti-hilang). Kalau situs sumber melarang, pakai tautan aslinya.
    jobs.forEach(({ id, src }) => run(async () => {
      try {
        const blob = await (await fetch(src)).blob();
        if (!blob.type.startsWith("image/")) throw new Error("bukan gambar");
        await host(id, new File([blob], `img.${blob.type.split("/")[1] || "png"}`, { type: blob.type }), !src.startsWith("data:"));
      } catch {
        ref.current?.querySelector(`img[data-up="${id}"]`)?.removeAttribute("data-up");
      }
    }));
  };

  const paste = (e) => {
    const cd = e.clipboardData;
    const h = cd.getData("text/html");
    const files = imageFiles(cd.files);
    const onlyImg = h && /<img/i.test(h) && !textOf(h);
    e.preventDefault();
    if (h && !(onlyImg && files.length)) return insertHtml(h);
    if (files.length) return insertFiles(files);
    const t = cd.getData("text/plain");
    if (t) insertHtml(esc(t));
  };

  const hasPayload = (dt) => dt && (Array.from(dt.types ?? []).includes("Files") || Array.from(dt.types ?? []).includes("text/html") || Array.from(dt.types ?? []).includes("text/uri-list"));
  const drop = (e) => {
    setDrag(false);
    if (internalDrag.current) return;
    const dt = e.dataTransfer;
    const files = imageFiles(dt.files);
    const h = dt.getData("text/html");
    const uri = dt.getData("text/uri-list");
    const isImgUri = /^https?:.*\.(png|jpe?g|gif|webp|avif)/i.test(uri);
    if (!files.length && !h && !isImgUri) return;
    e.preventDefault();
    const r = document.caretRangeFromPoint?.(e.clientX, e.clientY);
    if (r) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    if (files.length) return insertFiles(files);
    if (h) return insertHtml(h);
    insertHtml(`<img src="${esc(uri.split("\n")[0].trim())}" alt="">`);
  };

  return (
    <div className={`rounded-2xl border-2 bg-card transition-colors ${drag ? "border-brand bg-tint/40" : "border-line focus-within:border-brand/60"}`}>
      <div className="top-0 z-10 sticky flex flex-wrap items-center gap-0.5 bg-soft p-1.5 border-line border-b rounded-t-2xl">
        <ToolBtn icon={Undo2} label="Urungkan" onClick={() => exec("undo")} />
        <ToolBtn icon={Redo2} label="Ulangi" onClick={() => exec("redo")} />
        <Sep />
        <ToolBtn icon={Heading2} label="Judul bagian" onClick={() => exec("formatBlock", "h2")} />
        <ToolBtn icon={Heading3} label="Sub-judul" onClick={() => exec("formatBlock", "h3")} />
        <Sep />
        <ToolBtn icon={Bold} label="Tebal" onClick={() => exec("bold")} />
        <ToolBtn icon={Italic} label="Miring" onClick={() => exec("italic")} />
        <ToolBtn icon={Underline} label="Garis bawah" onClick={() => exec("underline")} />
        <Sep />
        <ToolBtn icon={List} label="Daftar" onClick={() => exec("insertUnorderedList")} />
        <ToolBtn icon={ListOrdered} label="Daftar bernomor" onClick={() => exec("insertOrderedList")} />
        <ToolBtn icon={Quote} label="Kutipan / teks biasa" onClick={toggleQuote} />
        <ToolBtn icon={Link2} label="Tautan" onClick={() => { const u = window.prompt("Alamat tautan (https://…)"); if (u) exec("createLink", u); }} />
        <Sep />
        <ToolBtn icon={ImagePlus} label="Sisipkan gambar" onClick={() => fileRef.current?.click()} />
        <ToolBtn icon={RemoveFormatting} label="Hapus format" onClick={() => exec("removeFormat")} />
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={(e) => { insertFiles(imageFiles(e.target.files)); e.target.value = ""; }} />
      </div>

      <div className="relative">
        {isEmpty && (
          <p className="top-5 left-5 absolute text-fg-4 pointer-events-none">
            Tulis di sini… atau tempel (Ctrl+V) teks &amp; gambar dari mana saja. Gambar juga bisa ditarik langsung ke sini.
          </p>
        )}
        <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Isi artikel"
          onInput={update} onKeyDown={exitEmptyQuote} onPaste={paste} onDrop={drop}
          onDragStart={() => { internalDrag.current = true; }} onDragEnd={() => { internalDrag.current = false; }}
          onDragOver={(e) => { if (!internalDrag.current && hasPayload(e.dataTransfer)) { e.preventDefault(); setDrag(true); } }}
          onDragLeave={() => setDrag(false)}
          className="article-content article-editor px-5 py-4 min-h-[48vh] max-h-[70vh] overflow-y-auto outline-none" />
        {drag && (
          <div className="absolute inset-0 flex justify-center items-center bg-brand/10 rounded-b-2xl pointer-events-none">
            <span className="flex items-center gap-2 bg-brand shadow-lg px-4 py-2 rounded-full font-bold text-on-brand text-sm"><UploadCloud size={18} /> Lepaskan untuk menyisipkan</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Gambar header: drop / paste / klik ----------
function CoverDrop({ url, onChange }) {
  const { push } = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const take = async (files) => {
    const f = imageFiles(files)[0];
    if (!f) return;
    setBusy(true);
    try { onChange(await bkService.uploadImage(f)); }
    catch (e) { push("error", "Gagal mengunggah gambar", e.message); }
    finally { setBusy(false); }
  };
  return (
    <div tabIndex={0} role="button" aria-label="Gambar header: tarik, tempel, atau klik"
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onPaste={(e) => { const f = imageFiles(e.clipboardData.files); if (f.length) { e.preventDefault(); take(f); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`group relative flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center outline-none transition-colors focus:border-brand ${over ? "border-brand bg-tint" : "border-line-2 bg-soft hover:border-brand/60"}`}>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      {url ? (
        <>
          <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex justify-center items-center gap-2 bg-black/45 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
            <span className="bg-white px-3 py-1.5 rounded-full font-bold text-fg text-xs">Ganti</span>
            <span role="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="bg-white px-3 py-1.5 rounded-full font-bold text-rose-600 text-xs">Hapus</span>
          </div>
        </>
      ) : (
        <div className="p-4 text-fg-3">
          {busy ? <Loader2 className="mx-auto animate-spin" size={26} /> : <UploadCloud className="mx-auto text-brand" size={28} />}
          <p className="mt-2 font-bold text-fg-2 text-sm">Gambar header</p>
          <p className="mt-0.5 text-xs">Tarik, tempel (Ctrl+V), atau klik</p>
        </div>
      )}
      {busy && url && <div className="absolute inset-0 place-items-center grid bg-white/60"><Loader2 className="animate-spin" /></div>}
    </div>
  );
}

function ArticleEditor({ open, onClose, initial, onSaved }) {
  const { push } = useToast();
  const [a, setA] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (open) { setA(initial ? { ...initial, html: blocksToHtml(initial.blocks) } : empty); setPreview(false); }
  }, [open, initial]);

  const set = (p) => setA((s) => ({ ...s, ...p }));

  const save = async () => {
    if (!a.title.trim()) return push("error", "Judul wajib diisi");
    setBusy(true);
    try {
      const { html, ...rest } = a;
      await bkService.saveArticle({
        ...rest,
        title: a.title.trim(),
        excerpt: a.excerpt?.trim() || textOf(html).slice(0, 160),
        blocks: hasContent(html) ? [{ type: "p", text: html }] : [],
      });
      push("success", "Artikel tersimpan");
      onSaved(); onClose();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} size="xl" title={initial ? "Ubah artikel" : "Artikel baru"}>
      <div className="space-y-5">
        <input value={a.title} onChange={(e) => set({ title: e.target.value })} placeholder="Judul artikel…" aria-label="Judul"
          className="bg-transparent px-1 py-1 border-0 border-line focus:border-brand border-b-2 outline-none w-full font-extrabold text-fg placeholder:text-fg-4 text-2xl sm:text-3xl tracking-tight transition-colors" />

        <div className="gap-4 grid md:grid-cols-[1fr_15rem]">
          <div className="space-y-3">
            <div>
              <p className="mb-2 font-bold text-fg-3 text-xs uppercase tracking-wider">Kategori</p>
              <div className="flex flex-wrap gap-1.5">
                {CATS.map((c) => (
                  <button key={c} type="button" onClick={() => set({ category: c })}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${a.category === c ? "bg-brand text-on-brand" : "bg-soft text-fg-2 hover:bg-tint"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 font-bold text-fg-3 text-xs uppercase tracking-wider">Ringkasan <span className="font-medium normal-case tracking-normal">(kosong = otomatis dari isi)</span></p>
              <textarea rows={3} value={a.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} placeholder="Satu-dua kalimat pembuka…"
                className="bg-soft focus:bg-card px-3.5 py-2.5 border-2 border-transparent focus:border-brand rounded-2xl outline-none w-full text-sm leading-relaxed resize-none" />
            </div>
          </div>
          <CoverDrop url={a.cover_url} onChange={(url) => set({ cover_url: url })} />
        </div>

        <div className="flex justify-between items-center">
          <p className="font-bold text-fg-3 text-xs uppercase tracking-wider">Isi artikel</p>
          <Button size="sm" variant="ghost" icon={preview ? EyeOff : Eye} onClick={() => setPreview((v) => !v)}>
            {preview ? "Kembali ke editor" : "Pratinjau"}
          </Button>
        </div>

        <div className={preview ? "hidden" : ""}>
          <BodyEditor html={a.html} onChange={(html) => set({ html })} onBusy={setUploading} />
        </div>
        {preview && (
          <div className="article-sheet">
            <ArticleBlocks blocks={hasContent(a.html) ? [{ type: "p", text: a.html }] : []} />
          </div>
        )}

        <div className="bottom-0 z-10 sticky flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 bg-card/95 backdrop-blur -mx-1 px-1 pt-3 pb-1 border-line border-t">
          <button type="button" role="switch" aria-checked={a.is_published} onClick={() => set({ is_published: !a.is_published })}
            className="flex items-center gap-2.5 font-bold text-fg-2 text-sm">
            <span className={`relative h-6 w-11 rounded-full transition-colors ${a.is_published ? "bg-brand" : "bg-line-2"}`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${a.is_published ? "left-[22px]" : "left-0.5"}`} />
            </span>
            {a.is_published ? "Terbit — terlihat oleh santri" : "Draf — belum terlihat santri"}
          </button>
          <div className="flex items-center gap-2">
            {uploading && <span className="flex items-center gap-1.5 text-fg-3 text-xs"><Loader2 size={14} className="animate-spin" /> Mengunggah gambar…</span>}
            <Button variant="ghost" onClick={onClose}>Batal</Button>
            <Button variant="primary" icon={Check} loading={busy} disabled={uploading} onClick={save}>Simpan</Button>
          </div>
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
