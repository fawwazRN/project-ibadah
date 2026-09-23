import { supabase } from "../lib/supabaseClient";

const SELECT = `*, leader:profiles!zikir_sessions_leader_id_fkey(id, full_name, class_name)`;

export const zikirService = {
  // Semua user terautentikasi bisa melihat (RLS: select true).
  async list({ from } = {}) {
    let q = supabase
      .from("zikir_sessions")
      .select(SELECT)
      .order("session_date")
      .order("time_start");
    if (from) q = q.gte("session_date", from);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  // repeat_weeks: generate jadwal yang sama untuk N pekan ke depan
  // (tanggal bergeser +7 hari tiap pekan). Duplikat dilewati otomatis.
  async create({
    session_date,
    session_type,
    time_start,
    location,
    leader_id,
    note,
    repeat_weeks = 1,
  }) {
    const n = Math.max(1, Math.min(12, Number(repeat_weeks) || 1));
    const rows = Array.from({ length: n }, (_, i) => {
      const d = new Date(`${session_date}T00:00:00`);
      d.setDate(d.getDate() + i * 7);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        session_date: iso,
        session_type,
        time_start,
        location: location || null,
        leader_id: leader_id || null,
        note: note || null,
      };
    });
    const { error } = await supabase
      .from("zikir_sessions")
      .insert(rows, {
        onConflict: "session_date,session_type",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  },

  async update(id, payload) {
    const { error } = await supabase
      .from("zikir_sessions")
      .update(payload)
      .eq("id", id);
    if (error) throw error;
  },

  // Database menolak hapus untuk tanggal lampau (policy RLS).
  async remove(id) {
    const { error } = await supabase
      .from("zikir_sessions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
