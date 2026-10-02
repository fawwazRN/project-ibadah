import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";
import { fetchAll } from "../lib/fetchAll";

const SELECT = `*, prayer_time, rule:rules(name, points, category, scope),
  santri:profiles!violations_santri_id_fkey(id, full_name, class_name),
  recorder:profiles!violations_recorded_by_fkey(full_name)`;

const label = (v) => `${v.rule?.name ?? ""} — ${v.santri?.full_name ?? ""}`;

export const violationService = {
  // RLS menentukan cakupan: santri otomatis hanya menerima datanya sendiri,
  // admin menerima semuanya. Filter opsional berupa kolom langsung.
  async list(filters = {}) {
    // Ambil SEMUA data (berhalaman), bukan hanya 500 terbaru.
    return fetchAll(() => {
      let q = supabase
        .from("violations")
        .select(SELECT, { count: "exact" })
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false }); // tie-breaker agar paginasi stabil
      if (filters.santri_id) q = q.eq("santri_id", filters.santri_id);
      if (filters.status) q = q.eq("status", filters.status);
      if (filters.rule_id) q = q.eq("rule_id", filters.rule_id);
      if (filters.from)
        q = q.gte("occurred_at", new Date(filters.from).toISOString());
      return q;
    });
  },

  async create({ santri_id, rule_id, occurred_at, prayer_time, note }) {
    // recorded_by diisi otomatis oleh database (default app_my_profile_id).
    const { data, error } = await supabase
      .from("violations")
      .insert({
        santri_id,
        rule_id,
        occurred_at,
        prayer_time: prayer_time || null,
        note: note || null,
      })
      .select(SELECT)
      .single();
    if (error) throw error;
    await auditService.log(
      "violation_created",
      "violation",
      data.id,
      label(data),
    );
    return data;
  },

  // Catat pelanggaran yang SAMA untuk banyak santri sekaligus (satu request).
  async createMany({ santri_ids, rule_id, occurred_at, prayer_time, note }) {
    const rows = santri_ids.map((santri_id) => ({
      santri_id,
      rule_id,
      occurred_at,
      prayer_time: prayer_time || null,
      note: note || null,
    }));
    const { data, error } = await supabase
      .from("violations")
      .insert(rows)
      .select(SELECT);
    if (error) throw error;
    await Promise.all(
      data.map((v) =>
        auditService.log("violation_created", "violation", v.id, label(v)),
      ),
    );
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from("violations")
      .update({ status })
      .eq("id", id)
      .select(SELECT)
      .single();
    if (error) throw error;
    const action =
      { revoked: "violation_revoked", confirmed: "violation_confirmed" }[
        status
      ] ?? "violation_updated";
    await auditService.log(action, "violation", id, label(data));
    return data;
  },

  async updateNote(id, note) {
    const { data, error } = await supabase
      .from("violations")
      .update({ note: note || null })
      .eq("id", id)
      .select(SELECT)
      .single();
    if (error) throw error;
    await auditService.log("violation_updated", "violation", id, label(data));
    return data;
  },
};
