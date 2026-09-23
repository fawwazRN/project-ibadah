import { supabase } from "../lib/supabaseClient";
import { auditService } from "./auditService";

const SELECT = `*, violation:violations(id, occurred_at, note, status,
    rule:rules(name, points, category),
    santri:profiles!violations_santri_id_fkey(full_name, class_name)),
  santri:profiles!reports_santri_id_fkey(full_name, class_name),
  reviewer:profiles!reports_reviewed_by_fkey(full_name)`;

const rLabel = (r) =>
  `${r?.violation?.rule?.name ?? ""} — ${r?.violation?.santri?.full_name ?? r?.santri?.full_name ?? ""}`;

export const reportService = {
  // RLS: santri hanya menerima laporannya sendiri.
  async listMine() {
    const { data, error } = await supabase
      .from("reports")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async listAll() {
    const { data, error } = await supabase
      .from("reports")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data;
  },

  // santri_id diisi otomatis oleh database; status pelanggaran jadi 'reported'
  // lewat trigger on_report_created di sisi database.
  async create({ violation_id, reason, explanation }) {
    const { data, error } = await supabase
      .from("reports")
      .insert({ violation_id, reason, explanation })
      .select(SELECT)
      .single();
    if (error) throw error;
    await auditService.log("report_submitted", "report", data.id, rLabel(data));
    return data;
  },

  // Atomik di database: update laporan + status pelanggaran sekaligus.
  async review({ id, decision, review_note }) {
    const { error } = await supabase.rpc("review_report", {
      p_report_id: id,
      p_decision: decision,
      p_review_note: review_note || null,
    });
    if (error) throw error;
    const action =
      { accepted: "report_accepted", rejected: "report_rejected" }[decision] ??
      "report_reviewing";
    await auditService.log(action, "report", id, null, { review_note });
  },
};
