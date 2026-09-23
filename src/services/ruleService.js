import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

export const ruleService = {
  async list({ activeOnly = false } = {}) {
    let q = supabase.from("rules").select("*").order("category").order("name");
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  // created_by diisi otomatis oleh database.
  async create(payload) {
    const { data, error } = await supabase
      .from("rules")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("rule_created", "rule", data.id, data.name);
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("rules")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("rule_updated", "rule", id, data.name);
    return data;
  },

  async setActive(id, is_active, name) {
    const { data, error } = await supabase
      .from("rules")
      .update({ is_active })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log(
      is_active ? "rule_activated" : "rule_deactivated",
      "rule",
      id,
      name,
    );
    return data;
  },
};
