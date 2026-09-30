import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CalendarDays, MapPin, X, ChevronRight } from "lucide-react";
import { eventService } from "../../services/eventService";
import { fmtDate } from "../../lib/date";

// Kartu undangan untuk dashboard semua peran.
// - Data: getActive() (publik, dummy fallback)
// - Bisa ditutup (X) — tersimpan di sessionStorage per acara
// - Tidak muncul bila undangan global di-hidden Super Admin
export default function InvitationCard() {
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

  if (hidden || dismissed || !event) return null;

  const dismiss = () => {
    if (dismissedKey) sessionStorage.setItem(dismissedKey, "1");
    setDismissed(true);
  };

  return (
    <div className="relative bg-gradient-to-r from-brand/[0.12] via-brand/[0.06] to-transparent shadow-card border border-brand/25 rounded-2xl overflow-hidden animate-fade-up">
      {/* Aksen dekor */}
      <div className="-top-10 -right-10 absolute border border-brand/15 rounded-full size-40 pointer-events-none" />
      <div className="-top-4 -right-4 absolute border border-brand/10 rounded-full size-24 pointer-events-none" />

      <div className="flex flex-wrap items-center gap-4 p-5">
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
          className="place-items-center grid hover:bg-white/10 rounded-lg size-8 text-slate-500 hover:text-slate-300 transition-colors shrink-0">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
