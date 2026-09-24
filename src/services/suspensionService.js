import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

export const suspensionService = {
  async list(status = null) {
    const { data, error } = await supabase.rpc("list_suspensions", {
      p_status: status,
    });
    if (error) throw error;
    return data;
  },
  async listMine() {
    const { data, error } = await supabase.rpc("list_my_suspensions");
    if (error) throw error;
    return data;
  },
  async cancel(id, reason) {
    const { error } = await supabase
      .from("suspensions")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) throw error;
    await auditService.log(
      "suspension_cancelled",
      "suspension",
      id,
      reason ?? null,
    );
  },
};
