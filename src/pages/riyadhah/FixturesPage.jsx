import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  ShieldCheck,
  BadgeCheck,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { MATCH_STATUS_LABELS, MATCH_STATUS_TONES } from "../../lib/constants";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { auditService } from "../../services/auditService";
import { supabase } from "../../lib/supabaseClient";

export default function FixturesPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [ctx, setCtx] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [week, setWeek] = useState(1);
  const [error, setError] = useState(null);
  const [resultFor, setResultFor] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const c = await leagueService.getContext();
    setCtx(c);
    const [ms, ts] = await Promise.all([
      matchService.list(c.season_id),
      leagueService.listTeams(c.phase_id),
    ]);
    setMatches(ms ?? []);
    setTeams(ts ?? []);
    setWeek(c.current_week ?? 1);
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!ctx) return <LoadingState rows={7} />;

  const maxWeek = Math.max(1, ...matches.map((m) => m.week));
  const weekMatches = matches.filter((m) => m.week === week);

  const transition = async (m, action, label) => {
    const ok = await confirm({
      title: `${label}?`,
      message: "Status pertandingan diperbarui & tercatat di log audit.",
      confirmText: label,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await matchService.transition(m.id, action);
      push("success", label);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    } finally {
      setBusy(false);
    }
  };

  // Hapus jadwal — hanya untuk yang belum punya hasil (diproteksi RLS juga)
  const removeMatch = async (m) => {
    const ok = await confirm({
      title: "Hapus pertandingan?",
      message: `${m.home_name} vs ${m.away_name} (Pekan ${m.week}) akan dihapus dari jadwal. Hanya pertandingan tanpa hasil yang boleh dihapus.`,
      confirmText: "Ya, hapus",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { error: e } = await supabase
        .from("matches")
        .delete()
        .eq("id", m.id);
      if (e) throw e;
      await auditService.log(
        "match_deleted",
        "match",
        m.id,
        `Pekan ${m.week}: ${m.home_name} vs ${m.away_name}`,
      );
      push("success", "Pertandingan dihapus");
      load();
    } catch (err) {
      push(
        "error",
        "Gagal menghapus",
        err.message?.includes("row-level")
          ? "Hanya pertandingan berstatus Terjadwal/Draf/Ditunda/Dibatalkan yang dapat dihapus."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Jadwal & Hasil"
        description={`${ctx.phase_name} · ${ctx.season_name} — jadwal dibuat manual oleh Qism Riyadhah.`}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setAddOpen(true)}>
            Tambah Pertandingan
          </Button>
        }
      />

      <div className="flex justify-between items-center mb-4">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={week <= 1}
          onClick={() => setWeek((w) => w - 1)}
        />
        <p className="font-display font-semibold text-slate-200 text-sm">
          PEKAN {week} <span className="text-slate-600">/ {maxWeek}</span>
        </p>
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronRight}
          disabled={week >= maxWeek}
          onClick={() => setWeek((w) => w + 1)}
        />
      </div>

      <Card>
        <CardHeader
          title={`Laga Pekan ${week}`}
          description={`${weekMatches.length} pertandingan`}
        />
        {weekMatches.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Belum ada laga pekan ini"
            description="Gunakan tombol “Tambah Pertandingan” untuk membuat jadwal secara manual."
          />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {weekMatches.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3">
                <p className="flex-1 min-w-0 text-slate-200 text-sm truncate">
                  {m.home_name} <span className="text-slate-600">vs</span>{" "}
                  {m.away_name}
                  {m.home_score != null && (
                    <span className="ml-2 font-mono font-semibold text-brand-soft">
                      {m.home_score} - {m.away_score}
                    </span>
                  )}
                </p>
                <span className="text-slate-500 text-xs">
                  {m.scheduled_at
                    ? new Date(m.scheduled_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })
                    : "—"}
                </span>
                <Badge tone={MATCH_STATUS_TONES[m.status]}>
                  {MATCH_STATUS_LABELS[m.status]}
                </Badge>
                <div className="flex gap-2">
                  {["scheduled", "draft"].includes(m.status) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Pencil}
                      onClick={() => setResultFor(m)}>
                      Input Hasil
                    </Button>
                  )}
                  {["submitted", "draft"].includes(m.status) && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={ShieldCheck}
                      loading={busy}
                      onClick={() => transition(m, "verify", "Verifikasi")}>
                      Verifikasi
                    </Button>
                  )}
                  {m.status === "verified" && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={BadgeCheck}
                      loading={busy}
                      onClick={() =>
                        transition(m, "official", "Jadikan Resmi")
                      }>
                      Resmikan
                    </Button>
                  )}
                  {["scheduled", "draft", "postponed", "cancelled"].includes(
                    m.status,
                  ) && (
                    <Button
                      size="sm"
                      variant="dangerSoft"
                      icon={Trash2}
                      loading={busy}
                      onClick={() => removeMatch(m)}
                      title="Hapus pertandingan"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddFixtureModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        ctx={ctx}
        teams={teams}
        defaultWeek={week}
        onSaved={() => {
          setAddOpen(false);
          load();
        }}
      />

      <ResultModal
        match={resultFor}
        onClose={() => setResultFor(null)}
        onSaved={() => {
          setResultFor(null);
          load();
        }}
      />
    </div>
  );
}

// ---------- Modal: tambah pertandingan manual ----------
function AddFixtureModal({ open, onClose, ctx, teams, defaultWeek, onSaved }) {
  const { push } = useToast();
  const activeTeams = teams.filter((t) => t.status === "active");
  const [form, setForm] = useState({
    week: defaultWeek,
    home_team_id: "",
    away_team_id: "",
    scheduled_at: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        week: defaultWeek,
        home_team_id: "",
        away_team_id: "",
        scheduled_at: "",
        notes: "",
      });
      setErrors({});
    }
  }, [open, defaultWeek]);

  const submit = async () => {
    const errs = {};
    if (!form.week || Number(form.week) < 1)
      errs.week = "Pekan wajib diisi (≥ 1).";
    if (!form.home_team_id) errs.home = "Pilih tim home.";
    if (!form.away_team_id) errs.away = "Pilih tim away.";
    if (form.home_team_id && form.home_team_id === form.away_team_id)
      errs.away = "Tim home dan away tidak boleh sama.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await matchService.createFixture({
        phase_id: ctx.phase_id,
        season_id: ctx.season_id,
        week: form.week,
        home_team_id: form.home_team_id,
        away_team_id: form.away_team_id,
        scheduled_at: form.scheduled_at || null,
        notes: form.notes || null,
      });
      push(
        "success",
        "Pertandingan dibuat",
        "Masuk daftar pekan terkait dengan status Terjadwal.",
      );
      onSaved();
    } catch (e) {
      push(
        "error",
        "Gagal membuat pertandingan",
        e.message?.includes("duplicate")
          ? "Kedua tim ini sudah pernah bertemu di musim ini."
          : e.message,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Pertandingan" size="md">
      <div className="space-y-4">
        <div className="gap-3 grid grid-cols-2">
          <Field label="Pekan" required error={errors.week}>
            <Input
              type="number"
              min="1"
              max="60"
              value={form.week}
              onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
            />
          </Field>
          <Field
            label="Tanggal main (opsional)"
            hint="Penting untuk pengecekan suspensi pemain.">
            <Input
              type="date"
              className="[color-scheme:dark]"
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduled_at: e.target.value }))
              }
            />
          </Field>
        </div>

        <div className="gap-3 grid grid-cols-2">
          <Field label="Tim Home" required error={errors.home}>
            <Select
              value={form.home_team_id}
              placeholder="Pilih tim…"
              onChange={(e) =>
                setForm((f) => ({ ...f, home_team_id: e.target.value }))
              }
              options={activeTeams.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
          <Field label="Tim Away" required error={errors.away}>
            <Select
              value={form.away_team_id}
              placeholder="Pilih tim…"
              onChange={(e) =>
                setForm((f) => ({ ...f, away_team_id: e.target.value }))
              }
              options={activeTeams.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
        </div>

        <Field label="Catatan (opsional)">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Mis. lapangan, ketentuan khusus…"
          />
        </Field>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Pertandingan dibuat dengan status{" "}
          <span className="font-medium text-slate-400">Terjadwal</span>. Hasil
          diisi belakangan lewat tombol “Input Hasil”. Kedua tim tidak boleh
          bertemu dua kali dalam satu musim.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            Buat Pertandingan
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Modal: input hasil ----------
function ResultModal({ match, onClose, onSaved }) {
  const { push } = useToast();
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (match) {
      setHome(match.home_score ?? "");
      setAway(match.away_score ?? "");
      setNotes(match.notes ?? "");
    }
  }, [match]);
  if (!match) return null;

  const save = async (asDraft) => {
    const h = Number(home),
      a = Number(away);
    if (!Number.isInteger(h) || h < 0 || !Number.isInteger(a) || a < 0)
      return push("error", "Skor tidak valid", "Gunakan bilangan bulat ≥ 0.");
    setSaving(true);
    try {
      await matchService.setResult(match.id, h, a, notes, asDraft);
      push(
        "success",
        asDraft ? "Tersimpan sebagai draf" : "Hasil dikirim untuk verifikasi",
      );
      onSaved();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      title={`Input Hasil — Pekan ${match.week}`}>
      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          <span className="font-semibold">{match.home_name}</span> vs{" "}
          <span className="font-semibold">{match.away_name}</span>
        </p>
        <div className="gap-3 grid grid-cols-2">
          <Field label={`Gol ${match.home_name}`} required>
            <Input
              type="number"
              min="0"
              value={home}
              onChange={(e) => setHome(e.target.value)}
            />
          </Field>
          <Field label={`Gol ${match.away_name}`} required>
            <Input
              type="number"
              min="0"
              value={away}
              onChange={(e) => setAway(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Catatan (opsional)">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="secondary"
            loading={saving}
            onClick={() => save(true)}>
            Simpan Draf
          </Button>
          <Button
            variant="primary"
            loading={saving}
            onClick={() => save(false)}>
            Kirim untuk Verifikasi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
