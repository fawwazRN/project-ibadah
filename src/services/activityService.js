import { supabase } from "../lib/supabaseClient";
import { countBy } from "../lib/calc";
import { startOfMonth } from "../lib/date";

export const activityService = {
  // RLS: santri otomatis hanya menerima miliknya.
  async list({ santri_id, from } = {}) {
    let q = supabase
      .from("ibadah_activities")
      .select("*")
      .order("activity_date", { ascending: false })
      .limit(1000);
    if (santri_id) q = q.eq("santri_id", santri_id);
    if (from) q = q.gte("activity_date", from);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async monthlySummary(santri_id) {
    const from = startOfMonth().toISOString().slice(0, 10);
    const rows = await this.list({ santri_id, from });
    return countBy(rows, (r) => r.activity_type);
  },
};
