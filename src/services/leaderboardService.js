import { supabase } from "../lib/supabaseClient";

export const leaderboardService = {
  // Ranking "paling nakal" — poin pelanggaran bulan berjalan (revoked tidak dihitung).
  async get() {
    const { data, error } = await supabase.rpc("get_leaderboard");
    if (error) throw error;
    return (
      (data ?? [])
        // Yang belum kena poin tidak masuk papan peringkat
        .filter((r) => (r.score ?? 0) > 0)
        // Pengurutan di client juga (pengaman), sama aturannya dengan SQL:
        // poin ↓ → jumlah pelanggaran ↓ → nama A-Z
        .sort(
          (a, b) =>
            b.score - a.score ||
            (b.violation_count ?? 0) - (a.violation_count ?? 0) ||
            a.full_name.localeCompare(b.full_name),
        )
        .map((r, i) => ({ ...r, rank: i + 1 }))
    );
  },
};
