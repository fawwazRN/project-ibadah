import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CalendarDays, MapPin, X, ChevronRight } from "lucide-react";
import { eventService } from "../../services/eventService";
import { fmtDate } from "../../lib/date";

// Kartu undangan GLOBAL — dipasang SEKALI di DashboardLayout & GuestLayout,
// jadi muncul di semua halaman dan tetap menempel di bawah layar saat di-scroll.
// - Data: getActive() (publik, dummy fallback)
// - Bisa ditutup (X) — tersimpan di sessionStorage per acara
// - Tidak muncul bila undangan global di-hidden Super Admin
// - sidebarClass: offset kiri agar tidak menutupi sidebar (desktop)
export default function InvitationCard({ sidebarClass = "lg:left-64" }) {
  const [event, setEvent] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(() => {
    eventService
      .getSettings()
      .then((s) => {
        if (!s.invitation_visible) setHidden(true);
      })
      .catch(() => {});
    eventService
      .getActive()
      .then(setEvent)
      .catch(() => {});
  }, []);
  useEffect(load, []);

  // Dismiss per acara — sesi ini saja
  const dismissedKey = useMemo(
    () => (event ? `invite_card_dismissed_${event.id}` : null),
    [event],
  );
  useEffect(() => {
    if (dismissedKey && sessionStorage.getItem(dismissedKey) === "1")
      setDismissed(true);
  }, [dismissedKey]);

  const visible = !(hidden || dismissed || !event);

  // Beri ruang di dasar halaman supaya kartu tidak menutupi konten paling bawah.
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "7rem";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    if (dismissedKey) sessionStorage.setItem(dismissedKey, "1");
    setDismissed(true);
  };

  return (
    <div
      className={`print:hidden bottom-0 z-30 fixed inset-x-0 ${sidebarClass} pointer-events-none`}
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
      }}>
      <div className="mx-auto px-4 lg:px-8 max-w-7xl">
        {/* Dasar solid gelap + lapisan tint warna qism → tampilan sama,
            tapi konten di belakang tidak tembus saat di-scroll */}
        <div className="relative bg-ink-900 shadow-card border border-brand/25 rounded-2xl overflow-hidden animate-fade-up pointer-events-auto">
          <div className="absolute inset-0 bg-brand/10 pointer-events-none" />
          {/* Aksen dekor */}
          <div className="-top-10 -right-10 absolute border border-brand/15 rounded-full size-40 pointer-events-none" />
          <div className="-top-4 -right-4 absolute border border-brand/10 rounded-full size-24 pointer-events-none" />

          <div className="relative flex flex-wrap items-center gap-4 p-4 sm:p-5">
            <span className="place-items-center grid bg-brand/15 border border-brand/30 rounded-2xl size-12 text-brand-soft shrink-0">
              <Sparkles size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.25em]">
                Undangan Acara OSIS
              </p>
              <p className="mt-0.5 font-display font-bold text-slate-50 text-base truncate">
                {event.title}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500">
                {event.event_date && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={11} /> {fmtDate(event.event_date)}
                  </span>
                )}
                {event.location_name && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={11} /> {event.location_name}
                  </span>
                )}
              </p>
            </div>
            <Link
              to="/undangan"
              className="flex items-center gap-1.5 bg-brand/15 hover:bg-brand/25 px-4 py-2.5 border border-brand/40 rounded-lg font-semibold text-brand-soft text-xs hover:scale-105 transition-all shrink-0">
              Buka Undangan <ChevronRight size={13} />
            </Link>
            <button
              type="button"
              onClick={dismiss}
              title="Tutup kartu ini"
              aria-label="Tutup kartu undangan"
              className="place-items-center grid hover:bg-white/10 rounded-lg size-8 text-slate-500 hover:text-slate-300 transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
