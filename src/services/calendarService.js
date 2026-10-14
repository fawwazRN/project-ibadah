import { supabase } from "../lib/supabaseClient";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const calendarService = {
  list() {
    return supabase.from("osis_events").select("*").order("start_date").order("start_time", { nullsFirst: true }).then(unwrap);
  },
  async getSettings() {
    const { data } = await supabase.from("calendar_settings").select("*").eq("id", 1).maybeSingle();
    return data ?? { qism_can_edit: true };
  },
  async setQismCanEdit(value) {
    await supabase
      .from("calendar_settings")
      .update({ qism_can_edit: value, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .then(unwrap);
  },
  async save(ev, profileId) {
    const { id, ...f } = ev;
    const row = { ...f, updated_by: profileId, updated_at: new Date().toISOString() };
    if (!row.start_time) row.start_time = null;
    if (!row.end_date) row.end_date = row.start_date;
    return id
      ? supabase.from("osis_events").update(row).eq("id", id).select().single().then(unwrap)
      : supabase.from("osis_events").insert({ ...row, created_by: profileId }).select().single().then(unwrap);
  },
  async remove(id) {
    await supabase.from("osis_events").delete().eq("id", id).then(unwrap);
  },
};
