import { supabase } from "../lib/supabaseClient";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const curhatService = {
  // ---- santri ----
  async myThread(profileId) {
    const found = await supabase.from("curhat_threads").select("*").eq("student_id", profileId).maybeSingle().then(unwrap);
    if (found) return found;
    return supabase.from("curhat_threads").insert({ student_id: profileId }).select().single().then(unwrap);
  },
  messages(threadId) {
    return supabase.from("curhat_messages").select("*").eq("thread_id", threadId).order("created_at").then(unwrap);
  },
  async send(threadId, sender, body) {
    const msg = await supabase.from("curhat_messages").insert({ thread_id: threadId, sender, body }).select().single().then(unwrap);
    await supabase
      .from("curhat_threads")
      .update({
        last_message_at: new Date().toISOString(),
        ...(sender === "student" ? { unread_admin: true } : { unread_student: true }),
      })
      .eq("id", threadId);
    return msg;
  },
  async markRead(threadId, who) {
    await supabase.from("curhat_threads").update(who === "admin" ? { unread_admin: false } : { unread_student: false }).eq("id", threadId);
  },
  // ---- super admin ----
  inbox() {
    return supabase.from("curhat_threads").select("*, student:profiles(*)").order("last_message_at", { ascending: false }).then(unwrap);
  },
  async unreadCount() {
    const { count } = await supabase.from("curhat_threads").select("id", { count: "exact", head: true }).eq("unread_admin", true);
    return count ?? 0;
  },
};
