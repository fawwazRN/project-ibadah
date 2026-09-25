import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

export const teamService = {
  async createTeam(name, phaseId) {
    const { data, error } = await supabase
      .from("teams")
      .insert({ name, phase_id: phaseId })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("team_created", "team", data.id, name);
    return data;
  },

  async renameTeam(id, name) {
    const { error } = await supabase
      .from("teams")
      .update({ name })
      .eq("id", id);
    if (error) throw error;
    await auditService.log("team_updated", "team", id, name);
  },

  async listLeaders(teamId) {
    const { data, error } = await supabase
      .from("team_leaders")
      .select(
        "*, student:profiles!team_leaders_student_id_fkey(full_name, class_name)",
      )
      .eq("team_id", teamId)
      .order("appointed_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  // Historis: ketua lama TIDAK ditimpa — diakhiri (ended_at), rekam baru.
  async appointLeader(teamId, studentId, phaseId) {
    await supabase
      .from("team_leaders")
      .update({ ended_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .is("ended_at", null);
    const { data, error } = await supabase
      .from("team_leaders")
      .insert({ team_id: teamId, student_id: studentId, phase_id: phaseId })
      .select("*, student:profiles!team_leaders_student_id_fkey(full_name)")
      .single();
    if (error) throw error;
    await auditService.log(
      "leader_appointed",
      "team_leader",
      data.id,
      data.student?.full_name,
    );
    return data;
  },

  // Tambah anggota dengan posisi (pemain/kiper) — maks 1 kiper aktif per tim.
  async addMember(teamId, studentId, seasonId, position = "pemain") {
    const { data, error } = await supabase
      .from("team_memberships")
      .insert({
        team_id: teamId,
        student_id: studentId,
        season_id: seasonId,
        position,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") {
        // unique violation
        throw new Error(
          position === "kiper"
            ? "Tim ini sudah memiliki kiper aktif."
            : "Santri ini sudah terdaftar aktif di sebuah tim untuk musim ini. Akhiri keanggotaan lamanya dulu.",
        );
      }
      throw error;
    }
    await auditService.log(
      "membership_added",
      "team_membership",
      data.id,
      position,
      { team_id: teamId, season_id: seasonId },
    );
    return data;
  },

  async endMember(membershipId) {
    const { error } = await supabase
      .from("team_memberships")
      .update({
        status: "left",
        left_at: new Date().toISOString().slice(0, 10),
      })
      .eq("id", membershipId);
    if (error) throw error;
    await auditService.log(
      "membership_ended",
      "team_membership",
      membershipId,
      null,
    );
  },
};
