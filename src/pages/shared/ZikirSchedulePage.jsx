import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sunrise,
  Sunset,
  MapPin,
  User,
  Pencil,
  Trash2,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../components/ui/States";
import { ZikirSessionFormModal } from "../../components/zikir/ZikirSessionFormModal";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
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

export default function ZikirSchedulePage({ role }) {
  const canManage = role === "osis_ibadah";
  const { push } = useToast();
  const confirm = useConfirm();

  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = dayKey(new Date());

  const load = useCallback(() => {
    setError(null);
    zikirService
      .list({ from: today })
      .then(setSessions)
      .catch((e) => setError(e.message));
  }, [today]);
  useEffect(load, [load]);

  // Kelompokkan per tanggal
  const groups = useMemo(() => {
    const m = new Map();
    for (const s of sessions ?? []) {
      if (!m.has(s.session_date)) m.set(s.session_date, []);
      m.get(s.session_date).push(s);
    }
    return [...m.entries()];
  }, [sessions]);

  const remove = async (s) => {
    const ok = await confirm({
      title: "Hapus jadwal zikir ini?",
      message: `${dayLabel(s.session_date)} · Zikir ${s.session_type === "pagi" ? "Pagi" : "Petang"} ${timeLabel(s.time_start)} akan dihapus dari daftar.`,
      confirmText: "Ya, hapus",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await zikirService.remove(s.id);
      push("success", "Jadwal dihapus");
      load();
    } catch (e) {
      push("error", "Gagal menghapus jadwal", e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Jadwal Zikir Pagi Petang"
        description={
          canManage
            ? "Atur jadwal zikir dan tentukan santri yang memimpin setiap sesi."
            : "Jadwal zikir mendatang beserta imam yang memimpin."
        }
        actions={
          canManage && (
            <Button
              variant="primary"
              icon={CalendarPlus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}>
              Tambah Jadwal
            </Button>
          )
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !sessions ? (
        <LoadingState rows={6} />
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="Belum ada jadwal"
            description={
              canManage
                ? "Buat jadwal pertama — gunakan opsi “ulangi setiap pekan” agar tidak perlu input manual tiap pekan."
                : "Belum ada jadwal zikir mendatang. Cek kembali nanti."
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([date, list]) => (
            <Card
              key={date}
              className={date === today ? "border-brand/30" : ""}>
              <CardHeader
                title={dayLabel(date)}
                description={date === today ? "Hari ini" : undefined}
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
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-slate-500 text-xs">
                        {s.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={11} /> {s.location}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <User size={11} />
                          {s.leader?.full_name ? (
                            <>
                              Imam:{" "}
                              <span className="font-medium text-slate-300">
                                {s.leader.full_name}
                              </span>
                              {s.leader.class_name
                                ? ` (${s.leader.class_name})`
                                : ""}
                            </>
                          ) : (
                            "Imam belum ditentukan"
                          )}
                        </span>
                      </p>
                      {s.note && (
                        <p className="mt-0.5 text-slate-600 text-xs truncate italic">
                          {s.note}
                        </p>
                      )}
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Pencil}
                          loading={busy}
                          onClick={() => {
                            setEditing(s);
                            setFormOpen(true);
                          }}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="dangerSoft"
                          icon={Trash2}
                          loading={busy}
                          onClick={() => remove(s)}>
                          Hapus
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <ZikirSessionFormModal
        open={formOpen}
        session={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
