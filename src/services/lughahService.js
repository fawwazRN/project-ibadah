import { supabase } from "../lib/supabaseClient";

export const lughahService = {
  async listPeriods() {
    const { data, error } = await supabase.rpc("list_exam_periods");
    if (error) throw error;
    return data;
  },
  async createPeriod(name, start) {
    const { data, error } = await supabase.rpc("create_exam_period", {
      p_name: name || null,
      p_start: start || null,
    });
    if (error) throw error;
    return data;
  },
  async setCurrentPeriod(id) {
    const { error } = await supabase.rpc("set_current_exam_period", {
      p_period_id: id,
    });
    if (error) throw error;
  },
  async completion(periodId) {
    const { data, error } = await supabase.rpc("list_lughah_completion", {
      p_period_id: periodId,
    });
    if (error) throw error;
    return data;
  },
  async toggleField(studentId, periodId, field, value) {
    const { error } = await supabase.rpc("toggle_lughah_field", {
      p_student_id: studentId,
      p_period_id: periodId,
      p_field: field,
      p_value: value,
    });
    if (error) throw error;
  },
  async scores(periodId) {
    const { data, error } = await supabase.rpc("list_lughah_scores", {
      p_period_id: periodId,
    });
    if (error) throw error;
    return data;
  },
  async setScore(studentId, periodId, score) {
    const { error } = await supabase.rpc("set_lughah_score", {
      p_student_id: studentId,
      p_period_id: periodId,
      p_score: score,
    });
    if (error) throw error;
  },
  async stats(periodId) {
    const { data, error } = await supabase.rpc("get_lughah_stats", {
      p_period_id: periodId,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },
  async myRecord(periodId) {
    const { data, error } = await supabase.rpc("get_my_lughah_record", {
      p_period_id: periodId,
    });
    if (error) throw error;
    return data?.[0] ?? null;
  },
};
