import { supabase } from "../lib/supabaseClient";

const norm = (email) => (email ?? "").trim().toLowerCase();

export const profileService = {
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

  // Sekarang lewat RPC security definer — dijamin tidak terfilter RLS
  async listClaimable() {
    const { data, error } = await supabase.rpc("list_claimable_santri");
    if (error) throw error;
    return data;
  },

  async adminResetClaim(profileId) {
    const { error } = await supabase.rpc("admin_reset_claim", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },

  async adminDeleteAccount(profileId) {
    const { error } = await supabase.rpc("admin_delete_auth_account", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },

  async adminDeleteSantri(profileId) {
    const { error } = await supabase.rpc("admin_delete_santri", {
      p_profile_id: profileId,
    });
    if (error) throw error;
  },

  async listAdminEmails() {
    const { data, error } = await supabase
      .from("admin_emails")
      .select("*")
      .order("email");
    if (error) throw error;
    return data;
  },

  async addAdminEmail(email, addedByProfileId) {
    const e = norm(email);
    const { error } = await supabase
      .from("admin_emails")
      .insert({ email: e, added_by: addedByProfileId ?? null });
    if (error) throw error;
    const { data: p } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", e)
      .maybeSingle();
    if (p && p.role === "santri") {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ role: "osis_ibadah" })
        .eq("id", p.id);
      if (upErr) throw upErr;
    }
  },

  async removeAdminEmail(email) {
    const e = norm(email);
    const { error } = await supabase
      .from("admin_emails")
      .delete()
      .eq("email", e);
    if (error) throw error;
    const { data: p } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("email", e)
      .maybeSingle();
    if (p && p.role === "osis_ibadah") {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ role: "santri" })
        .eq("id", p.id);
      if (upErr) throw upErr;
    }
  },
};
