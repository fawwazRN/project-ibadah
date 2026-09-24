import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

export const leagueService = {
  async getContext() {
    const { data, error } = await supabase.rpc("get_league_context");
    if (error) throw error;
    return data?.[0] ?? null;
  },
  async listPhases() {
    const { data, error } = await supabase.rpc("list_phases");
    if (error) throw error;
    return data;
  },
  async listSeasons(phaseId) {
    const { data, error } = await supabase.rpc("list_seasons", {
      p_phase_id: phaseId,
    });
    if (error) throw error;
    return data;
  },
  async listTeams(phaseId) {
    const { data, error } = await supabase.rpc("list_teams", {
      p_phase_id: phaseId,
    });
    if (error) throw error;
    return data;
  },
  async listMemberships(seasonId, teamId = null) {
    const { data, error } = await supabase.rpc("list_memberships", {
      p_season_id: seasonId,
      p_team_id: teamId,
    });
    if (error) throw error;
    return data;
  },
  async getSettings() {
    const { data, error } = await supabase
      .from("league_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return data;
  },
  async updateSettings(tiebreakOrder) {
    const { error } = await supabase
      .from("league_settings")
      .update({
        tiebreak_order: tiebreakOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;
    await auditService.log(
      "settings_updated",
      "settings",
      null,
      "Pengaturan liga",
      { tiebreakOrder },
    );
  },
  async createPhase(name) {
    const { data: existing } = await supabase.rpc("list_phases");
    const num = Math.max(0, ...(existing ?? []).map((p) => p.phase_number)) + 1;
    const { data, error } = await supabase
      .from("phases")
      .insert({
        phase_number: num,
        name: name || `Fase ${num}`,
        status: "planned",
      })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("phase_created", "phase", data.id, data.name);
    return data;
  },
  async createSeason(phaseId, name) {
    const seasons = await this.listSeasons(phaseId);
    const num = Math.max(0, ...seasons.map((s) => s.season_number)) + 1;
    const { data, error } = await supabase
      .from("seasons")
      .insert({
        phase_id: phaseId,
        season_number: num,
        name: name || `Musim ${num}`,
      })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("season_created", "season", data.id, data.name);
    return data;
  },
  async setCurrentSeason(seasonId, phaseId) {
    await supabase
      .from("seasons")
      .update({ is_current: false })
      .eq("phase_id", phaseId);
    const { error } = await supabase
      .from("seasons")
      .update({ is_current: true, status: "active" })
      .eq("id", seasonId);
    if (error) throw error;
    await auditService.log("season_activated", "season", seasonId, null);
  },
  async completePhase(phaseId) {
    const { error } = await supabase.rpc("complete_phase", {
      p_phase_id: phaseId,
    });
    if (error) throw error;
  },
};
