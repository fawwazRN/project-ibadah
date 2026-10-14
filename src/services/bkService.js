import { supabase } from "../lib/supabaseClient";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Perkecil gambar besar (screenshot/foto) otomatis agar tidak kena batas ukuran
async function shrinkImage(file) {
  if (!file.type.startsWith("image/") || /gif|svg/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 900 * 1024) return file;
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.86));
    if (blob && blob.type === "image/webp" && blob.size < file.size) return new File([blob], "img.webp", { type: "image/webp" });
  } catch { /* pakai file asli */ }
  return file;
}

export const bkService = {
  // ---------- Percakapan (santri) ----------
  // Seluruh alur (±50–200 node) kecil → ambil sekali, jalankan di klien.
  async loadFlow() {
    const [nodes, choices] = await Promise.all([
      supabase.from("bk_nodes").select("*").eq("is_active", true).then(unwrap),
      supabase.from("bk_choices").select("*").order("sort").then(unwrap),
    ]);
    const byId = new Map(nodes.map((n) => [n.id, { ...n, choices: [] }]));
    for (const c of choices) byId.get(c.node_id)?.choices.push(c);
    // Tiap node pembuka = satu topik obrolan
    const starts = nodes
      .filter((n) => n.is_start)
      .sort((a, b) => (a.topic_sort ?? 0) - (b.topic_sort ?? 0) || a.title.localeCompare(b.title))
      .map((n) => byId.get(n.id));
    return { byId, starts, start: starts[0] ?? null };
  },

  async startSession(profileId) {
    return supabase
      .from("bk_sessions")
      .insert({ profile_id: profileId })
      .select("id")
      .single()
      .then(unwrap);
  },
  async saveSession(id, path, finished) {
    // Gagal simpan tidak boleh mengganggu obrolan.
    await supabase.from("bk_sessions").update({ path, finished }).eq("id", id);
  },

  // ---------- Admin: alur ----------
  async listNodes() {
    const [nodes, choices] = await Promise.all([
      supabase.from("bk_nodes").select("*").order("created_at").then(unwrap),
      supabase.from("bk_choices").select("*").order("sort").then(unwrap),
    ]);
    return nodes.map((n) => ({
      ...n,
      choices: choices.filter((c) => c.node_id === n.id),
    }));
  },

  async saveNode(node, choices) {
    const { id, ...fields } = node;
    // Banyak node pembuka diperbolehkan (satu pembuka = satu topik).
    const row = id
      ? await supabase.from("bk_nodes").update(fields).eq("id", id).select().single().then(unwrap)
      : await supabase.from("bk_nodes").insert(fields).select().single().then(unwrap);

    await supabase.from("bk_choices").delete().eq("node_id", row.id).then(unwrap);
    const rows = choices
      .filter((c) => c.label.trim())
      .slice(0, 3)
      .map((c, i) => ({
        node_id: row.id,
        label: c.label.trim(),
        next_node_id: c.next_node_id || null,
        sort: i,
      }));
    if (rows.length) await supabase.from("bk_choices").insert(rows).then(unwrap);
    return row;
  },

  async deleteNode(id) {
    await supabase.from("bk_nodes").delete().eq("id", id).then(unwrap);
  },

  // ---------- Artikel ----------
  async listArticles({ publishedOnly = false } = {}) {
    let q = supabase
      .from("bk_articles")
      .select("id,title,excerpt,cover_url,category,is_published,created_at")
      .order("created_at", { ascending: false });
    if (publishedOnly) q = q.eq("is_published", true);
    return q.then(unwrap);
  },
  async getArticle(id) {
    return supabase.from("bk_articles").select("*").eq("id", id).single().then(unwrap);
  },
  async saveArticle(a) {
    const { id, ...fields } = a;
    fields.updated_at = new Date().toISOString();
    return id
      ? supabase.from("bk_articles").update(fields).eq("id", id).select().single().then(unwrap)
      : supabase.from("bk_articles").insert(fields).select().single().then(unwrap);
  },
  async deleteArticle(id) {
    await supabase.from("bk_articles").delete().eq("id", id).then(unwrap);
  },
  async uploadImage(file) {
    file = await shrinkImage(file);
    if (file.size > 3 * 1024 * 1024) throw new Error("Gambar masih terlalu besar (maks. 3 MB).");
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace("svg+xml", "svg");
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("bk-media")
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("bk-media").getPublicUrl(path).data.publicUrl;
  },
};
