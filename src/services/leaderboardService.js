import { supabase } from "../lib/supabaseClient";

export const leaderboardService = {
  // Ranking "paling nakal" — poin pelanggaran bulan berjalan (revoked tidak dihitung).
  // Lewat RPC security definer supaya sama-sama kebal RLS.
  async get() {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (error) throw error;
    return (data ?? []).map((r, i) => ({ ...r, rank: i + 1 }));
  },
};
