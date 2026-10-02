import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";
import { fetchAll } from "../lib/fetchAll";

export const nyekerService = {
  // Ambil seluruh data per halaman agar tidak terpotong batas maksimum RPC.
  // RLS tetap menjadi penjaga akses: staff melihat data sesuai haknya, santri miliknya.
  async list({ from, to } = {}) {
    const rows = await fetchAll(() => {
      let query = supabase
        .from("nyeker_records")
        .select("*, student:profiles!student_id(full_name,class_name)", { count: "exact" })
        .order("nyeker_date", { ascending: false })
        .order("nyeker_time", { ascending: false })
        .order("id", { ascending: false });
      if (from) query = query.gte("nyeker_date", from);
      if (to) query = query.lte("nyeker_date", to);
      return query;
    });
    return rows.map((row) => ({
      ...row,
      full_name: row.student?.full_name ?? row.full_name ?? "Santri",
      class_name: row.student?.class_name ?? row.class_name ?? "—",
    }));
  },

  async stats() {
    const { data, error } = await supabase.rpc("get_nyeker_stats");
    if (error) throw error;
    return (
      data?.[0] ?? {
        total: 0,
        today: 0,
        this_week: 0,
        this_month: 0,
        students: 0,
      }
    );
  },

  // Rekap per santri — hanya nadzhofah (divalidasi di fungsi database)
  async recap({ from, to } = {}) {
    const { data, error } = await supabase.rpc("get_nyeker_recap", {
      p_from: from ?? null,
      p_to: to ?? null,
    });
    if (error) throw error;
    return data;
  },

  // Hapus catatan salah — hanya Nadzhofah/Super (RLS menolak santri)
  async remove(id) {
    const { error } = await supabase
      .from("nyeker_records")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await auditService.log("nyeker_deleted", "nyeker", id, null);
  },

  // ================= PENYITAAN BAJU & LELANG =================
  async listClothing() {
    const rows = await fetchAll(() =>
      supabase
        .from("clothing_confiscations")
        .select("*, student:profiles!student_id(full_name,class_name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
    );
    return rows.map((row) => ({
      ...row,
      full_name: row.student?.full_name ?? row.full_name ?? "Santri",
      class_name: row.student?.class_name ?? row.class_name ?? "—",
    }));
  },

  async clothingFinance() {
    const { data, error } = await supabase.rpc("get_clothing_finance");
    if (error) throw error;
    return (
      data?.[0] ?? {
        total_items: 0,
        total_standard: 0,
        total_auctioned: 0,
        total_income: 0,
      }
    );
  },

  // Catat penyitaan — harga standar 5000/baju
  async createClothing({ student_id, quantity, note }) {
    const { data, error } = await supabase
      .from("clothing_confiscations")
      .insert({
        student_id,
        quantity: Number(quantity) || 1,
        note: note || null,
      })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log(
      "clothing_created",
      "clothing",
      data.id,
      `${quantity} baju`,
    );
    return data;
  },

  // Hapus penyitaan salah — hanya Nadzhofah/Super (RLS menolak lainnya)
  async removeClothing(id) {
    const { error } = await supabase
      .from("clothing_confiscations")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await auditService.log("clothing_deleted", "clothing", id, null);
  },

  // Leaderboard nakal nadzhofah — gabungan nyeker + baju disita
  async naughtyLeaderboard() {
    const { data, error } = await supabase.rpc(
      "get_nadzhofah_naughty_leaderboard",
    );
    if (error) throw error;
    return data;
  },

  // Tandai denda lunas / belum lunas
  async setFinePaid(id, paid) {
    const { error } = await supabase
      .from("nyeker_records")
      .update({ fine_paid: paid })
      .eq("id", id);
    if (error) throw error;
    await auditService.log(
      paid ? "nyeker_fine_paid" : "nyeker_fine_unpaid",
      "nyeker",
      id,
      null,
    );
  },

  // Ubah nominal denda (mis. santri nyeker berulang → denda lebih besar)
  async setFineAmount(id, amount) {
    const { error } = await supabase
      .from("nyeker_records")
      .update({ fine_amount: Number(amount) })
      .eq("id", id);
    if (error) throw error;
    await auditService.log("nyeker_fine_updated", "nyeker", id, `Rp ${amount}`);
  },

  // Statistik denda
  async fineStats() {
    const { data, error } = await supabase.rpc("get_nyeker_fine_stats");
    if (error) throw error;
    return data?.[0] ?? { total_fine: 0, unpaid: 0, paid: 0 };
  },

  // Set hasil lelang (harga akhir) — menggantikan harga standar utk baris ini
  async setAuction(id, auctionPrice, auctionDate) {
    const { error } = await supabase
      .from("clothing_confiscations")
      .update({
        auction_price: Number(auctionPrice),
        auction_date: auctionDate || null,
      })
      .eq("id", id);
    if (error) throw error;
    await auditService.log(
      "clothing_auctioned",
      "clothing",
      id,
      `Rp ${auctionPrice}`,
    );
  },

  // Catat cepat — hanya nadzhofah (RLS memvalidasi)
  async create({ student_id, nyeker_date, nyeker_time, note, fine_amount = 5000 }) {
    const { data, error } = await supabase
      .from("nyeker_records")
      .insert({ student_id, nyeker_date, nyeker_time, note: note || null, fine_amount: Number(fine_amount) })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log(
      "nyeker_created",
      "nyeker",
      data.id,
      `${nyeker_date} ${String(nyeker_time).slice(0, 5)}`,
    );
    return data;
  },
};
