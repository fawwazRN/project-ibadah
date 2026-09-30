import { supabase } from "../lib/supabaseClient";

export const eventService = {
  // Ambil acara aktif — fallback dummy bila tabel kosong
  async getActive() {
    const { data, error } = await supabase.rpc("get_active_event");
    if (error) throw error;
    if (data?.[0]) return { ...data[0], _dummy: false };
    // DUMMY FALLBACK — dipakai bila belum ada acara di database
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(19, 0, 0, 0);
    return {
      id: "dummy",
      title: "Malam Keagungan OSIS",
      subtitle: "Apresiasi & Silaturahmi Pengurus 2026",
      description:
        "Acara puncak apresiasi pengurus OSIS madrasah — penyampaian laporan pertanggungjawaban seluruh qism, penghargaan divisi terbaik, dan silaturahmi akbar.",
      event_date: d.toISOString(),
      location_name: "Aula Besar Madrasah",
      location_url: "https://maps.google.com",
      _dummy: true,
    };
  },
  async listRsvps(eventId) {
    const { data, error } = await supabase.rpc("list_event_rsvps", {
      p_event_id: eventId,
    });
    if (error) throw error;
    return data;
  },

  // Visibilitas undangan (publik — guest juga perlu tahu)
  async getSettings() {
    const { data, error } = await supabase.rpc("get_site_settings");
    if (error) throw error;
    return data?.[0] ?? { invitation_visible: true };
  },

  // Toggle hidden/visible — hanya Super Admin (RLS menolak lainnya)
  async setInvitationVisible(visible) {
    const { error } = await supabase
      .from("site_settings")
      .update({
        invitation_visible: visible,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) throw error;
    const { auditService } = await import("./auditService");
    await auditService.log(
      "invitation_visibility_changed",
      "settings",
      null,
      visible ? "Undangan ditampilkan" : "Undangan disembunyikan",
    );
  },

  // Kirim RSVP — butuh login (guest tidak bisa; tombol RSVP akan minta login)
  async sendRsvp({ event_id, guest_name, guest_class, attendance, message }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("event_rsvps").insert({
      event_id,
      guest_name,
      guest_class: guest_class || null,
      attendance,
      message: message || null,
      profile_id: user?.id ?? null,
    });
    if (error) throw error;
  },
};
