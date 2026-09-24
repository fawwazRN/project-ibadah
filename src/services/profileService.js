import { supabase } from "../lib/supabaseClient";

const norm = (email) => (email ?? "").trim().toLowerCase();

// Guard kecil: siapa boleh menambah/mengedit santri (untuk pesan error ramah
// sebelum menabrak RLS). Super admin selalu boleh.
const canManageSantri = (role) =>
  ["qism_ibadah", "qism_riyadhah", "super_admin"].includes(role);

export const profileService = {
  // ================= BACA =================

  // Semua santri (untuk staff: form pelanggaran, manajemen santri, tim, filter rekap)
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

  // Daftar nama yang bisa diklaim — RPC security definer (kebal RLS)
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

  // ================= TAMBAH SANTRI =================
  // (Ibadah / Riyadhah / Super Admin)
  async addSantri({ full_name, class_name, nis }, callerRole) {
    if (!canManageSantri(callerRole))
      throw new Error(
        "Hanya Qism Ibadah, Qism Riyadhah, atau Super Admin yang dapat menambah santri.",
      );

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        full_name: full_name.trim(),
        class_name: class_name.trim(),
        nis: nis?.trim() || null,
        role: "santri",
      })
      .select("*")
      .single();
    if (error) throw error;

    const { auditService } = await import("./auditService");
    await auditService.log(
      "santri_created",
      "profile",
      data.id,
      `${data.full_name} (${data.class_name})`,
    );
    return data;
  },

  // ================= EDIT SANTRI =================
  // (Ibadah / Riyadhah / Super Admin) — riwayat aman karena
  // pelanggaran/tim/laporan merujuk profile_id, bukan teks nama/kelas.
  async updateSantri(profileId, { full_name, class_name, nis }, callerRole) {
    if (!canManageSantri(callerRole))
      throw new Error(
        "Hanya Qism Ibadah, Qism Riyadhah, atau Super Admin yang dapat mengedit santri.",
      );

    const payload = {
      full_name: full_name.trim(),
      class_name: class_name.trim(),
      nis: nis?.trim() || null,
    };
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", profileId)
      .select("*")
      .single();
    if (error) throw error;

    const { auditService } = await import("./auditService");
    await auditService.log(
      "santri_updated",
      "profile",
      profileId,
      `${payload.full_name} (${payload.class_name})`,
    );
    return data;
  },

  // ================= CALON ADMIN =================
  // (khusus Super Admin — dibuka lewat menu Pengguna & Peran / Daftar Email)

  // Daftarkan email + peran. Bila akunnya sudah aktif & terklaim, perannya
  // langsung diperbarui. Bila belum, otomatis aktif saat dia klaim nama.
  async addAdminEmail(email, role = "qism_ibadah", addedByProfileId) {
    const e = norm(email);
    const { error } = await supabase
      .from("admin_emails")
      .insert({ email: e, role, added_by: addedByProfileId ?? null });
    if (error) throw error;

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

  // Hapus dari daftar admin; bila akunnya aktif sebagai staff (bukan super),
  // perannya dikembalikan menjadi santri.
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

  // ================= MANAJEMEN AKUN / ORANG =================
  // (khusus Ibadah + Super Admin — divalidasi ulang di database/RPC)

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
