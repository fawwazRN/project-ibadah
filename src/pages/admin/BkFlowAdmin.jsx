import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Flag, List, Network, Pencil, Plus, Search, Trash2 } from "lucide-react";
import BkFlowMap from "../../components/admin/BkFlowMap";
import { bkService } from "../../services/bkService";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TOPIC_ICONS } from "../../components/ui/TopicIcon";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { EmptyState, LoadingState } from "../../components/ui/States";

const MOODS = [
  { value: "talk", label: "Ngobrol biasa" },
  { value: "care", label: "Peduli / menenangkan" },
  { value: "happy", label: "Senang / menyemangati" },
  { value: "think", label: "Berpikir" },
];
const blank = () => ({
  node: { title: "", message: "", mood: "talk", is_start: false, article_id: null, is_active: true, topic_summary: "", topic_category: "", topic_cover: "", topic_emoji: "chat", topic_tone: "brand", topic_sort: 0 },
  choices: [{ label: "", next_node_id: "" }],
});

function NodeEditor({ open, onClose, initial, nodes, articles, onSaved }) {
  const { push } = useToast();
  const [f, setF] = useState(blank());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      initial
        ? {
            node: {
              id: initial.id,
              title: initial.title,
              message: initial.message,
              mood: initial.mood,
              is_start: initial.is_start,
              article_id: initial.article_id,
              is_active: initial.is_active,
              topic_summary: initial.topic_summary ?? "",
              topic_category: initial.topic_category ?? "",
              topic_cover: initial.topic_cover ?? "",
              topic_emoji: initial.topic_emoji ?? "chat",
              topic_tone: initial.topic_tone ?? "brand",
              topic_sort: initial.topic_sort ?? 0,
            },
            choices: initial.choices.length
              ? initial.choices.map((c) => ({ label: c.label, next_node_id: c.next_node_id ?? "" }))
              : [{ label: "", next_node_id: "" }],
          }
        : blank(),
    );
  }, [open, initial]);

  const setNode = (p) => setF((s) => ({ ...s, node: { ...s.node, ...p } }));
  const setChoice = (i, p) =>
    setF((s) => ({ ...s, choices: s.choices.map((c, j) => (j === i ? { ...c, ...p } : c)) }));

  const targets = nodes
    .filter((n) => n.id !== f.node.id)
    .map((n) => ({ value: n.id, label: n.title }));

  const save = async () => {
    if (!f.node.title.trim() || !f.node.message.trim())
      return push("error", "Judul & ucapan karakter wajib diisi");
    setBusy(true);
    try {
      await bkService.saveNode(
        { ...f.node, title: f.node.title.trim(), message: f.node.message.trim() },
        f.choices,
      );
      push("success", "Percakapan tersimpan");
      onSaved();
      onClose();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={initial ? "Ubah percakapan" : "Percakapan baru"}>
      <div className="space-y-4">
        <Field label="Judul (hanya terlihat admin)" required>
          <Input value={f.node.title} onChange={(e) => setNode({ title: e.target.value })} placeholder="mis. Rindu rumah — pembuka" />
        </Field>
        <Field label="Ucapan Kak Peci" required hint="Pisahkan gelembung chat dengan satu baris kosong.">
          <Textarea rows={5} value={f.node.message} onChange={(e) => setNode({ message: e.target.value })} />
        </Field>
        <div className="gap-3 grid sm:grid-cols-2">
          <Field label="Suasana karakter">
            <Select options={MOODS} value={f.node.mood} onChange={(e) => setNode({ mood: e.target.value })} />
          </Field>
          <Field label="Rekomendasi artikel (jika berakhir)">
            <Select
              placeholder="— tanpa artikel —"
              options={articles.map((a) => ({ value: a.id, label: a.title }))}
              value={f.node.article_id ?? ""}
              onChange={(e) => setNode({ article_id: e.target.value || null })}
            />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 font-bold text-fg-2 text-xs">
            Pilihan jawaban santri (maks. 3) — kosongkan tujuan untuk mengakhiri obrolan
          </p>
          <div className="space-y-2.5">
            {f.choices.map((c, i) => (
              <div key={i} className="gap-2 grid sm:grid-cols-[1fr_1fr_auto] bg-soft p-2.5 rounded-2xl">
                <Input placeholder={`Jawaban ${i + 1}`} value={c.label} onChange={(e) => setChoice(i, { label: e.target.value })} />
                <Select
                  placeholder="→ Akhiri obrolan"
                  options={targets}
                  value={c.next_node_id}
                  onChange={(e) => setChoice(i, { next_node_id: e.target.value })}
                />
                <Button
                  variant="ghost"
                  aria-label="Hapus pilihan"
                  icon={Trash2}
                  onClick={() => setF((s) => ({ ...s, choices: s.choices.filter((_, j) => j !== i) }))}
                />
              </div>
            ))}
          </div>
          {f.choices.length < 3 && (
            <Button size="sm" className="mt-2" icon={Plus} onClick={() => setF((s) => ({ ...s, choices: [...s.choices, { label: "", next_node_id: "" }] }))}>
              Tambah pilihan
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 font-bold text-fg-2 text-sm">
            <input type="checkbox" checked={f.node.is_start} onChange={(e) => setNode({ is_start: e.target.checked })} />
            Jadikan topik obrolan (pembuka)
          </label>
          <label className="flex items-center gap-2 font-bold text-fg-2 text-sm">
            <input type="checkbox" checked={f.node.is_active} onChange={(e) => setNode({ is_active: e.target.checked })} />
            Aktif
          </label>
        </div>

        {f.node.is_start && (
          <div className="space-y-3 bg-tint p-3.5 border-2 border-tint-line rounded-2xl">
            <p className="font-extrabold text-brand-dim text-xs uppercase tracking-wider">Tampilan topik (kartu seperti artikel)</p>
            <div className="gap-3 grid sm:grid-cols-[11rem_1fr]">
              <Field label="Ikon"><Select value={TOPIC_ICONS[f.node.topic_emoji] ? f.node.topic_emoji : "chat"} onChange={(e) => setNode({ topic_emoji: e.target.value })} options={Object.entries(TOPIC_ICONS).map(([value, m]) => ({ value, label: m.label }))} /></Field>
              <Field label="Ringkasan"><Input value={f.node.topic_summary} maxLength={90} onChange={(e) => setNode({ topic_summary: e.target.value })} placeholder="Cerita saat semangat belajar lagi turun" /></Field>
            </div>
            <div className="gap-3 grid grid-cols-2">
              <Field label="Label (mis. Perasaan)"><Input value={f.node.topic_category} onChange={(e) => setNode({ topic_category: e.target.value })} /></Field>
              <Field label="URL gambar cover (opsional)"><Input value={f.node.topic_cover} onChange={(e) => setNode({ topic_cover: e.target.value })} placeholder="https://…" /></Field>
            </div>
            <div className="gap-3 grid grid-cols-2">
              <Field label="Warna">
                <Select value={f.node.topic_tone} onChange={(e) => setNode({ topic_tone: e.target.value })}
                  options={[["brand", "Hijau"], ["ibadah", "Biru"], ["nadzhofah", "Oranye"], ["lughah", "Ungu"], ["riyadhah", "Merah"]].map(([value, label]) => ({ value, label }))} />
              </Field>
              <Field label="Urutan"><Input type="number" value={f.node.topic_sort} onChange={(e) => setNode({ topic_sort: Number(e.target.value) || 0 })} /></Field>
            </div>
          </div>
        )}

        <div className="flex sm:flex-row flex-col-reverse sm:justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={busy} onClick={save}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function BkFlowAdmin() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [nodes, setNodes] = useState(null);
  const [articles, setArticles] = useState([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState("map"); // map | list
  const [edit, setEdit] = useState({ open: false, node: null });

  const load = useCallback(async () => {
    try {
      const [n, a] = await Promise.all([bkService.listNodes(), bkService.listArticles()]);
      setNodes(n);
      setArticles(a);
    } catch (e) {
      push("error", "Gagal memuat alur", e.message);
      setNodes([]);
    }
  }, [push]);
  useEffect(() => { load(); }, [load]);

  const titleOf = useMemo(() => new Map((nodes ?? []).map((n) => [n.id, n.title])), [nodes]);
  const linked = useMemo(() => {
    const s = new Set();
    (nodes ?? []).forEach((n) => n.choices.forEach((c) => c.next_node_id && s.add(c.next_node_id)));
    return s;
  }, [nodes]);

  const shown = (nodes ?? []).filter((n) =>
    (n.title + n.message).toLowerCase().includes(q.toLowerCase()),
  );

  const remove = async (n) => {
    const ok = await confirm({
      tone: "danger",
      title: "Hapus percakapan?",
      message: `"${n.title}" akan dihapus. Pilihan yang mengarah ke sini akan menjadi akhir obrolan.`,
      confirmText: "Hapus",
    });
    if (!ok) return;
    try {
      await bkService.deleteNode(n.id);
      push("success", "Percakapan dihapus");
      load();
    } catch (e) {
      push("error", "Gagal menghapus", e.message);
    }
  };

  if (!nodes) return <LoadingState rows={4} />;
  const hasStart = nodes.some((n) => n.is_start);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Alur Kak Peci"
        description={`${nodes.length} percakapan · ${nodes.filter((n) => n.is_start).length} topik. Tandai node sebagai topik agar muncul sebagai kartu di halaman Kak Peci.`}
        actions={
          <>
            <div className="flex bg-soft p-1 rounded-xl">
              {[["map", Network, "Bagan"], ["list", List, "Daftar"]].map(([v, Icon, t]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-lg font-bold text-xs ${view === v ? "bg-card text-brand-dim shadow-sm" : "text-fg-3"}`}>
                  <Icon size={14} /> {t}
                </button>
              ))}
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setEdit({ open: true, node: null })}>Percakapan baru</Button>
          </>
        }
      />

      {!hasStart && nodes.length > 0 && (
        <p className="bg-amber-50 mb-4 px-4 py-3 border-2 border-amber-200 rounded-2xl font-bold text-amber-800 text-sm">
          Belum ada pembuka obrolan. Ubah salah satu percakapan lalu centang “Jadikan pembuka”.
        </p>
      )}

      {view === "map" ? (
        nodes.length ? <BkFlowMap nodes={nodes} onEdit={(n) => setEdit({ open: true, node: n })} /> : <EmptyState title="Belum ada percakapan" description="Tambahkan percakapan pertama." />
      ) : (
      <>
      <div className="relative mb-4">
        <Search size={16} className="top-1/2 left-3.5 absolute text-fg-4 -translate-y-1/2" />
        <Input className="pl-10" placeholder="Cari judul atau isi…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Tidak ada percakapan" description="Tambahkan percakapan pertama untuk memulai." />
      ) : (
        <div className="space-y-3">
          {shown.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-extrabold text-fg">{n.title}</h3>
                    {n.is_start && <Badge tone="brand"><Flag size={11} /> Pembuka</Badge>}
                    {!n.is_active && <Badge>Nonaktif</Badge>}
                    {!n.is_start && !linked.has(n.id) && <Badge tone="amber">Belum terhubung</Badge>}
                    {n.choices.length === 0 && <Badge tone="sky">Akhir obrolan</Badge>}
                  </div>
                  <p className="text-fg-3 text-sm line-clamp-2 whitespace-pre-wrap">{n.message}</p>
                  {n.choices.length > 0 && (
                    <ul className="space-y-1 mt-2.5">
                      {n.choices.map((c) => (
                        <li key={c.id} className="flex items-center gap-2 text-[13px]">
                          <span className="bg-soft-2 px-2.5 py-1 rounded-lg font-bold text-fg-2 truncate">{c.label}</span>
                          <ArrowRight size={13} className="text-fg-4 shrink-0" />
                          <span className="text-fg-3 truncate">{c.next_node_id ? titleOf.get(c.next_node_id) ?? "—" : "selesai"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Ubah" icon={Pencil} onClick={() => setEdit({ open: true, node: n })} />
                  <Button variant="ghost" size="sm" aria-label="Hapus" icon={Trash2} onClick={() => remove(n)} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      <NodeEditor
        open={edit.open}
        initial={edit.node}
        nodes={nodes}
        articles={articles}
        onClose={() => setEdit({ open: false, node: null })}
        onSaved={load}
      />
    </div>
  );
}
