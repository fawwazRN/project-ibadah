import { supabase } from "../lib/supabaseClient";

export const heartService = {
  // Seluruh santri: hati periode berjalan, bintang, status penghukuman.
  async board() {
    const { data, error } = await supabase.rpc("get_heart_board");
    if (error) throw error;
    return data ?? [];
  },
  async attendance(periodStart) {
    const { data, error } = await supabase
      .from("ibadah_punishments")
      .select("student_id, attended")
      .eq("period_start", periodStart);
    if (error) throw error;
    return data ?? [];
  },
  async setAttended(studentId, periodStart, attended) {
    const { error } = await supabase
      .from("ibadah_punishments")
      .upsert(
        { student_id: studentId, period_start: periodStart, attended, noted_at: new Date().toISOString() },
        { onConflict: "student_id,period_start" },
      );
    if (error) throw error;
  },
};
