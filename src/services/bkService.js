import { supabase } from "../lib/supabaseClient";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

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
    const startRaw = nodes.find((n) => n.is_start);
    return { byId, start: startRaw ? byId.get(startRaw.id) : null };
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
    // Satu node pembuka saja: lepas penanda dari node lain dulu.
    if (fields.is_start)
      await supabase.from("bk_nodes").update({ is_start: false }).eq("is_start", true);
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
    if (file.size > 3 * 1024 * 1024) throw new Error("Maksimal 3 MB per gambar.");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("bk-media")
      .upload(path, file, { cacheControl: "31536000", contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("bk-media").getPublicUrl(path).data.publicUrl;
  },
};
