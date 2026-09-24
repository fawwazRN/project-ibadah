import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

export const matchService = {
  async list(seasonId, status = null) {
    const { data, error } = await supabase.rpc("list_matches", {
      p_season_id: seasonId,
      p_status: status,
    });
    if (error) throw error;
    return data;
  },
  async detail(matchId) {
    const { data, error } = await supabase.rpc("get_match_detail", {
      p_match_id: matchId,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },
  async eligibility(matchId) {
    const { data, error } = await supabase.rpc("get_match_eligibility", {
      p_match_id: matchId,
    });
    if (error) throw error;
    return data;
  },
  async events(matchId) {
    const { data, error } = await supabase.rpc("list_match_events", {
      p_match_id: matchId,
    });
    if (error) throw error;
    return data;
  },
  async addEvent(matchId, teamId, playerId, eventType, minute, note) {
    const { error } = await supabase
      .from("match_events")
      .insert({
        match_id: matchId,
        team_id: teamId,
        player_id: playerId,
        event_type: eventType,
        minute: minute || null,
        note: note || null,
      });
    if (error) throw error;
    await auditService.log("match_event_added", "match", matchId, eventType);
  },

  // Buat pertandingan MANUAL oleh Riyadhah (tanpa skor) → status 'scheduled'
  async createFixture({
    phase_id,
    season_id,
    week,
    home_team_id,
    away_team_id,
    scheduled_at,
    notes,
  }) {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        phase_id,
        season_id,
        week: Number(week),
        home_team_id,
        away_team_id,
        scheduled_at: scheduled_at || null,
        notes: notes || null,
        status: "scheduled",
      })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log("match_created", "match", data.id, `Pekan ${week}`);
    return data;
  },

  // Entri hasil historis/manual (dengan skor) → 'submitted' atau 'verified'
  async createMatch({
    phase_id,
    season_id,
    week,
    home_team_id,
    away_team_id,
    home_score,
    away_score,
    scheduled_at,
    notes,
    direct_verified,
  }) {
    const { data, error } = await supabase
      .from("matches")
      .insert({
        phase_id,
        season_id,
        week,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        scheduled_at: scheduled_at || null,
        notes: notes || null,
        status: direct_verified ? "verified" : "submitted",
      })
      .select("*")
      .single();
    if (error) throw error;
    await auditService.log(
      "match_created",
      "match",
      data.id,
      `Pekan ${week} (hasil historis)`,
      { status: data.status },
    );
    return data;
  },

  async setResult(matchId, homeScore, awayScore, notes, asDraft = false) {
    const { error } = await supabase.rpc("set_match_result", {
      p_match_id: matchId,
      p_home: homeScore,
      p_away: awayScore,
      p_notes: notes,
      p_as_draft: asDraft,
    });
    if (error) throw error;
  },
  async transition(matchId, action) {
    const { error } = await supabase.rpc("transition_match", {
      p_match_id: matchId,
      p_action: action,
    });
    if (error) throw error;
  },
};
