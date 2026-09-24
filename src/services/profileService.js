import { supabase } from "../lib/supabaseClient";

const norm = (email) => (email ?? "").trim().toLowerCase();

export const profileService = {
  // ---------- Baca ----------

  // Semua santri (untuk admin: form pelanggaran, manajemen santri, filter rekap)
  async listSantri() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "santri")
      .order("class_name")
      .order("full_name");
    if (error) throw error;
    return data;
  },

  async listAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role")
      .order("class_name")
      .order("full_name");
    if (error) throw error;
    return data;
  },

  // Daftar nama yang bisa diklaim — lewat RPC security definer
  // (kebal RLS; hanya id/nama/kelas + penanda butuh NIS, tanpa data pribadi)
  async listClaimable() {
    const { data, error } = await supabase.rpc("list_claimable_santri");
    if (error) throw error;
    return data;
  },

  async listAdminEmails() {
    const { data, error } = await supabase
      .from("admin_emails")
      .select("*")
      .order("email");
    if (error) throw error;
    return data;
  },

  // ---------- Calon admin ----------

  // Daftarkan email + peran yang ditugaskan.
  // Bila akunnya sudah aktif & terklaim, perannya langsung diperbarui.
  // Bila belum, otomatis aktif saat dia klaim nama (trigger claim_santri_profile).
  async addAdminEmail(email, role = "qism_ibadah", addedByProfileId) {
    const e = norm(email);
    const { error } = await supabase
      .from("admin_emails")
      .insert({ email: e, role, added_by: addedByProfileId ?? null });
    if (error) throw error;

    // Akun sudah ada & terklaim → peran langsung diperbarui
    const { data: p } = await supabase
      .from("profiles")
      .select("id, role, user_id")
      .eq("email", e)
      .maybeSingle();
    if (p?.user_id) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", p.id);
      if (upErr) throw upErr;
    }
  },

  // Hapus dari daftar admin; bila akunnya sedang aktif sebagai staff
  // (dan bukan super admin), perannya dikembalikan menjadi santri.
  async removeAdminEmail(email) {
    const e = norm(email);
    const { error } = await supabase
      .from("admin_emails")
      .delete()
      .eq("email", e);
    if (error) throw error;

    const { data: p } = await supabase
      .from("profiles")
      .select("id, role, user_id")
      .eq("email", e)
      .maybeSingle();
    if (p?.user_id && p.role !== "super_admin" && p.role !== "santri") {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ role: "santri" })
        .eq("id", p.id);
      if (upErr) throw upErr;
    }
  },

  // ---------- Manajemen akun & orang (divalidasi di database) ----------

  // Lepas akun dari nama → nama kembali bisa diklaim. Riwayat tetap utuh.
  async adminResetClaim(profileId) {
    const { error } = await supabase.rpc("admin_reset_claim", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },

  // Hapus akun auth (email + sandi). Profil & riwayat tetap ada.
  async adminDeleteAccount(profileId) {
    const { error } = await supabase.rpc("admin_delete_auth_account", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },

  // Hapus permanen profil santri — hanya lolos jika belum punya riwayat.
  async adminDeleteSantri(profileId) {
    const { error } = await supabase.rpc("admin_delete_santri", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },
};
