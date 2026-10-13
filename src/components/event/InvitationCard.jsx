import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, CalendarDays, MapPin, X, ChevronRight } from "lucide-react";
import { eventService } from "../../services/eventService";
import { fmtDate } from "../../lib/date";

// Kartu undangan GLOBAL — dipasang SEKALI di setiap shell.
// - Data: getActive() (publik)
// - Bisa ditutup (X) — tersimpan di sessionStorage per acara
// - Tidak muncul bila undangan global di-hidden Super Admin
// - placement="tabbed"  → melayang di atas tab bar (mobile) / kanan-bawah (desktop)
//   placement="floating" → kanan-bawah (admin)
export default function InvitationCard({ placement = "floating" }) {
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
  useEffect(load, [load]);

  const dismissedKey = useMemo(
    () => (event ? `invite_card_dismissed_${event.id}` : null),
    [event],
  );
  useEffect(() => {
    if (dismissedKey && sessionStorage.getItem(dismissedKey) === "1")
      setDismissed(true);
  }, [dismissedKey]);

  const visible = !(hidden || dismissed || !event);
  if (!visible) return null;

  const dismiss = () => {
    if (dismissedKey) sessionStorage.setItem(dismissedKey, "1");
    setDismissed(true);
  };

  const pos =
    placement === "tabbed"
      ? "bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.6rem)] lg:bottom-5"
      : "bottom-4";

  return (
    <div
      className={`print:hidden fixed inset-x-3 ${pos} z-30 lg:inset-x-auto lg:right-5 lg:w-[400px] pointer-events-none`}>
      <div
        style={{ borderWidth: "var(--bw)" }}
        className="relative flex items-center gap-3 bg-card shadow-lg p-3 border-line rounded-2xl animate-pop pointer-events-auto">
        <span className="place-items-center grid bg-gold rounded-2xl size-11 text-[#3b2a00] shrink-0">
          <Sparkles size={20} strokeWidth={2.4} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-[10px] text-brand-dim uppercase tracking-[0.18em]">
            Undangan acara
          </p>
          <p className="font-display font-extrabold text-fg text-sm truncate">
            {event.title}
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 text-[11px] text-fg-3">
            {event.event_date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={11} /> {fmtDate(event.event_date)}
              </span>
            )}
            {event.location_name && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin size={11} /> {event.location_name}
              </span>
            )}
          </p>
        </div>
        <Link to="/undangan" className="btn btn-primary btn-sm shrink-0">
          Buka <ChevronRight size={14} strokeWidth={3} />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup kartu undangan"
          className="top-1.5 right-1.5 absolute place-items-center grid rounded-full size-6 text-fg-4 hover:text-fg-2 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
