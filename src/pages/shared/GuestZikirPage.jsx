import { useCallback, useEffect, useMemo, useState } from "react";
import { Sunrise, Sunset, MapPin, User, CalendarClock } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../components/ui/States";
import { zikirService } from "../../services/zikirService";
import { dayKey } from "../../lib/date";

const dayLabel = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const timeLabel = (t) => (t ?? "").slice(0, 5);

export default function GuestZikirPage() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);
  const today = dayKey(new Date());

  const load = useCallback(() => {
    setError(null);
    zikirService
      .list({ from: today })
      .then(setSessions)
      .catch((e) => setError(e.message));
  }, [today]);
  useEffect(load, [load]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const s of sessions ?? []) {
      if (!m.has(s.session_date)) m.set(s.session_date, []);
      m.get(s.session_date).push(s);
    }
    return [...m.entries()];
  }, [sessions]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Jadwal Zikir Pagi Petang"
        description="Jadwal zikir mendatang beserta imam yang memimpin."
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !sessions ? (
        <LoadingState rows={6} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarClock} title="Belum ada jadwal" />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, list]) => (
            <Card
              key={date}
              className={date === today ? "border-brand/30" : ""}>
              <CardHeader
                title={dayLabel(date)}
                actions={
                  date === today && <Badge tone="emerald">Hari Ini</Badge>
                }
              />
              <ul className="divide-y divide-white/[0.04]">
                {list.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-lg border ${
                        s.session_type === "pagi"
                          ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-300"
                          : "border-sky-400/20 bg-sky-400/[0.06] text-sky-300"
                      }`}>
                      {s.session_type === "pagi" ? (
                        <Sunrise size={16} />
                      ) : (
                        <Sunset size={16} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="flex items-center gap-2 font-medium text-slate-200 text-sm">
                        Zikir {s.session_type === "pagi" ? "Pagi" : "Petang"}
                        <span className="font-mono text-slate-500 text-xs">
                          {timeLabel(s.time_start)} WIB
                        </span>
                      </p>
                      <p className="flex flex-wrap items-center gap-x-3 mt-0.5 text-slate-500 text-xs">
                        {s.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} /> {s.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <User size={11} />
                          {s.leader_name ? (
                            <>
                              Imam:{" "}
                              <span className="font-medium text-slate-300">
                                {s.leader_name}
                              </span>
                            </>
                          ) : (
                            "Imam belum ditentukan"
                          )}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
