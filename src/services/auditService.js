import { supabase } from "../lib/supabaseClient";

export const auditService = {
  // Penulisan lewat RPC security definer — actor diisi database.
  async log(action, target_type, target_id, target_label, details) {
    const { error } = await supabase.rpc("log_audit", {
      p_action: action,
      p_target_type: target_type,
      p_target_id: target_id ?? null,
      p_target_label: target_label ?? null,
      p_details: details ?? null,
    });
    if (error) console.error("Gagal menulis audit log:", error.message); // jangan blokir aksi utama
  },

  async list({ action } = {}) {
    let q = supabase
      .from("audit_logs")
      .select("*, actor:profiles!audit_logs_actor_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (action) q = q.eq("action", action);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
};
