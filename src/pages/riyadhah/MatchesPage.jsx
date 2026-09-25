import { useCallback, useEffect, useState } from "react";
import { Plus, Eye, History, Trash2, Target } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import {
  MATCH_STATUS_LABELS,
  MATCH_STATUS_TONES,
  MATCH_EVENTS,
} from "../../lib/constants";
import { leagueService } from "../../services/leagueService";
import { matchService } from "../../services/matchService";
import { fmtDate } from "../../lib/date";

const EVENT_LABEL = {
  goal: "Gol",
  own_goal: "Gol Bunuh Diri",
  yellow: "Kartu Kuning",
  red: "Kartu Merah",
  substitution: "Pergantian",
};

export default function MatchesPage() {
  const [ctx, setCtx] = useState(null);
  const [matches, setMatches] = useState([]);
  const [fStatus, setFStatus] = useState("");
  const [error, setError] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [phases, setPhases] = useState([]);

  const load = useCallback(async () => {
    const c = await leagueService.getContext();
    setCtx(c);
    setMatches(await matchService.list(c.season_id));
    setPhases(await leagueService.listPhases());
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!ctx) return <LoadingState rows={8} />;

  const list = fStatus ? matches.filter((m) => m.status === fStatus) : matches;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Kelola Pertandingan"
        description="Entri hasil historis, verifikasi, dan catat event gol/kartu per pemain."
        actions={
          <Button
            variant="primary"
            icon={History}
            onClick={() => setHistOpen(true)}>
            Tambah Hasil Sebelumnya
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          placeholder="Semua status"
          options={Object.entries(MATCH_STATUS_LABELS).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
        />
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState title="Belum ada pertandingan" />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Pekan</Th>
                  <Th>Pertandingan</Th>
                  <Th>Skor</Th>
                  <Th>Tanggal</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <Tr key={m.id}>
                    <Td className="font-mono text-slate-500">{m.week}</Td>
                    <Td className="text-slate-200">
                      {m.home_name} <span className="text-slate-600">vs</span>{" "}
                      {m.away_name}
                    </Td>
                    <Td className="font-mono text-brand-soft">
                      {m.home_score ?? "–"} - {m.away_score ?? "–"}
                    </Td>
                    <Td className="text-slate-400">
                      {m.scheduled_at ? fmtDate(m.scheduled_at) : "—"}
                    </Td>
                    <Td>
                      <Badge tone={MATCH_STATUS_TONES[m.status]}>
                        {MATCH_STATUS_LABELS[m.status]}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Eye}
                        onClick={() => setDetail(m)}>
                        Detail
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <HistoricalModal
        open={histOpen}
        onClose={() => setHistOpen(false)}
        phases={phases}
        currentSeason={ctx.season_id}
        onSaved={() => {
          setHistOpen(false);
          load();
        }}
      />
      <MatchDetailModal match={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

// ================= Modal: entri hasil historis =================
function HistoricalModal({ open, onClose, phases, currentSeason, onSaved }) {
  const { push } = useToast();
  const [seasons, setSeasons] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    phase_id: "",
    season_id: currentSeason ?? "",
    week: 1,
    home_team_id: "",
    away_team_id: "",
    home_score: "",
    away_score: "",
    scheduled_at: "",
    notes: "",
    direct_verified: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || phases.length === 0) return;
    const first = phases.find((p) => p.status === "active") ?? phases[0];
    setForm((f) => ({ ...f, phase_id: first.id }));
    leagueService.listSeasons(first.id).then((s) => {
      setSeasons(s);
      const cur = s.find((x) => x.is_current) ?? s[0];
      setForm((f) => ({ ...f, season_id: cur?.id ?? currentSeason }));
    });
  }, [open, phases, currentSeason]);

  useEffect(() => {
    if (!form.phase_id) return;
    leagueService.listTeams(form.phase_id).then(setTeams);
  }, [form.phase_id]);

  const submit = async () => {
    if (
      !form.season_id ||
      !form.home_team_id ||
      !form.away_team_id ||
      form.home_score === "" ||
      form.away_score === ""
    )
      return push(
        "error",
        "Data belum lengkap",
        "Musim, tim, dan skor wajib diisi.",
      );
    if (form.home_team_id === form.away_team_id)
      return push("error", "Tim sama", "Tim home dan away tidak boleh sama.");
    setSaving(true);
    try {
      await matchService.createMatch({
        ...form,
        week: Number(form.week),
        home_score: Number(form.home_score),
        away_score: Number(form.away_score),
      });
      push(
        "success",
        "Hasil historis tercatat",
        form.direct_verified
          ? "Status: Terverifikasi."
          : "Status: Menunggu verifikasi.",
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
      open={open}
      onClose={onClose}
      title="Tambah Hasil Pertandingan Sebelumnya"
      size="md">
      <div className="space-y-4">
        <div className="gap-3 grid grid-cols-2">
          <Field label="Fase" required>
            <Select
              value={form.phase_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, phase_id: e.target.value }))
              }
              options={phases.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Field>
          <Field label="Musim" required>
            <Select
              value={form.season_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, season_id: e.target.value }))
              }
              options={seasons.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Field>
        </div>
        <div className="gap-3 grid grid-cols-2">
          <Field label="Pekan" required>
            <Input
              type="number"
              min="1"
              value={form.week}
              onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
            />
          </Field>
          <Field label="Tanggal main (opsional)">
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
          <Field label="Tim Home" required>
            <Select
              value={form.home_team_id}
              placeholder="Pilih tim…"
              onChange={(e) =>
                setForm((f) => ({ ...f, home_team_id: e.target.value }))
              }
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
          <Field label="Tim Away" required>
            <Select
              value={form.away_team_id}
              placeholder="Pilih tim…"
              onChange={(e) =>
                setForm((f) => ({ ...f, away_team_id: e.target.value }))
              }
              options={teams.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Field>
        </div>
        <div className="gap-3 grid grid-cols-2">
          <Field label="Skor Home" required>
            <Input
              type="number"
              min="0"
              value={form.home_score}
              onChange={(e) =>
                setForm((f) => ({ ...f, home_score: e.target.value }))
              }
            />
          </Field>
          <Field label="Skor Away" required>
            <Input
              type="number"
              min="0"
              value={form.away_score}
              onChange={(e) =>
                setForm((f) => ({ ...f, away_score: e.target.value }))
              }
            />
          </Field>
        </div>
        <Field label="Catatan (opsional)">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
        <label className="flex items-center gap-2 text-slate-300 text-sm">
          <input
            type="checkbox"
            checked={form.direct_verified}
            onChange={(e) =>
              setForm((f) => ({ ...f, direct_verified: e.target.checked }))
            }
            className="size-4 accent-emerald-500"
          />
          Langsung berstatus Terverifikasi
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            Simpan Hasil
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ================= Modal: detail + event =================
function MatchDetailModal({ match, onClose }) {
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const reloadEvents = useCallback(() => {
    if (!match) return;
    matchService.events(match.id).then(setEvents);
  }, [match]);
  useEffect(() => {
    if (!match) return;
    matchService.detail(match.id).then(setDetail);
    reloadEvents();
  }, [match, reloadEvents]);
  if (!match) return null;

  return (
    <Modal
      open={!!match}
      onClose={onClose}
      title={`Detail — Pekan ${match.week}`}
      size="lg">
      {detail && (
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-white/[0.02] p-4 border border-white/[0.06] rounded-xl">
            <p className="font-display font-semibold text-slate-100 text-base">
              {detail.home_name}{" "}
              <span className="font-mono text-brand-soft">
                {detail.home_score ?? "–"} : {detail.away_score ?? "–"}
              </span>{" "}
              {detail.away_name}
            </p>
            <Badge tone={MATCH_STATUS_TONES[detail.status]}>
              {MATCH_STATUS_LABELS[detail.status]}
            </Badge>
          </div>

          <EventPanel match={detail} events={events} onChanged={reloadEvents} />

          <div>
            <p className="mb-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
              Kelayakan Pemain
            </p>
            <EligibilityPanel matchId={detail.id} />
          </div>

          {detail.notes && (
            <p className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl text-slate-400 text-xs">
              {detail.notes}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ================= Panel event cepat =================
function EventPanel({ match, events, onChanged }) {
  const { push } = useToast();
  const [elig, setElig] = useState(null);
  const [minute, setMinute] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    matchService
      .eligibility(match.id)
      .then(setElig)
      .catch(() => setElig([]));
  }, [match.id]);

  // Hitung event per pemain (dari daftar event yang ada)
  const counts = {};
  for (const e of events) {
    const k = `${e.player_name}|${e.event_type}`;
    counts[k] = (counts[k] || 0) + 1;
  }

  const add = async (player, eventType) => {
    if (player.suspended) {
      return push(
        "error",
        "Pemain ter-suspensi",
        `${player.full_name} — ${player.suspension_info}. Pemain berstatus suspensi tidak dapat dicatat bermain.`,
      );
    }
    setBusy(true);
    try {
      await matchService.addEvent(
        match.id,
        player.team_id,
        player.student_id,
        eventType,
        minute ? Number(minute) : null,
      );
      onChanged();
    } catch (e) {
      push("error", "Gagal menambah event", e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (ev) => {
    setBusy(true);
    try {
      await matchService.removeEvent(match.id, ev.id);
      onChanged();
    } catch (e) {
      push("error", "Gagal menghapus event", e.message);
    } finally {
      setBusy(false);
    }
  };

  const byTeam = {};
  for (const p of elig ?? []) {
    if (!byTeam[p.team_name]) byTeam[p.team_name] = [];
    byTeam[p.team_name].push(p);
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <p className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
          Event Pertandingan{" "}
          <span className="text-slate-600">
            (opsional — klik tombol per pemain)
          </span>
        </p>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Menit:</span>
          <Input
            type="number"
            min="0"
            max="130"
            placeholder="—"
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            className="py-1 w-20"
          />
        </div>
      </div>

      {!elig ? (
        <LoadingState rows={3} />
      ) : (
        <div className="gap-3 grid sm:grid-cols-2">
          {Object.entries(byTeam).map(([teamName, players]) => (
            <div
              key={teamName}
              className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
              <p className="mb-2 font-semibold text-slate-200 text-sm">
                {teamName}
              </p>
              <ul className="space-y-1.5">
                {players.map((p) => {
                  const g = counts[`${p.full_name}|goal`] ?? 0;
                  const y = counts[`${p.full_name}|yellow`] ?? 0;
                  const r = counts[`${p.full_name}|red`] ?? 0;
                  return (
                    <li
                      key={p.student_id}
                      className="flex items-center gap-2 bg-white/[0.02] px-2.5 py-1.5 border border-white/[0.05] rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate text-xs font-medium ${p.suspended ? "text-slate-500" : "text-slate-200"}`}>
                          {p.full_name}
                          {p.suspended && (
                            <span className="ml-1.5 text-rose-300">
                              ⚠ Suspended
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {g > 0 && `⚽ ${g} `}
                          {y > 0 && `🟨 ${y} `}
                          {r > 0 && `🟥 ${r}`}
                          {g === 0 && y === 0 && r === 0 && "—"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={busy || p.suspended}
                          onClick={() => add(p, "goal")}
                          title="Tambah gol"
                          className="place-items-center grid bg-emerald-400/10 hover:bg-emerald-400/20 disabled:opacity-40 border border-emerald-400/25 rounded-md size-7 font-bold text-[11px] text-emerald-300 transition-colors">
                          ⚽
                        </button>
                        <button
                          type="button"
                          disabled={busy || p.suspended}
                          onClick={() => add(p, "yellow")}
                          title="Kartu kuning"
                          className="place-items-center grid bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-40 border border-amber-400/25 rounded-md size-7 font-bold text-[11px] text-amber-300 transition-colors">
                          🟨
                        </button>
                        <button
                          type="button"
                          disabled={busy || p.suspended}
                          onClick={() => add(p, "red")}
                          title="Kartu merah"
                          className="place-items-center grid bg-rose-400/10 hover:bg-rose-400/20 disabled:opacity-40 border border-rose-400/25 rounded-md size-7 font-bold text-[11px] text-rose-300 transition-colors">
                          🟥
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Daftar event tercatat */}
      <div className="mt-3">
        <p className="mb-1.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
          Tercatat ({events.length})
        </p>
        {events.length === 0 ? (
          <p className="text-slate-600 text-xs italic">Belum ada event.</p>
        ) : (
          <ul className="border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-3 py-2">
                <span className="w-8 font-mono text-[11px] text-slate-500 shrink-0">
                  {e.minute != null ? `${e.minute}'` : "—"}
                </span>
                <span className="flex-1 min-w-0 text-slate-300 text-xs truncate">
                  {e.player_name}{" "}
                  <span className="text-slate-500">({e.team_name})</span> —{" "}
                  {EVENT_LABEL[e.event_type] ?? e.event_type}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(e)}
                  className="place-items-center grid hover:bg-rose-500/10 rounded-md size-6 text-slate-500 hover:text-rose-300 transition-colors">
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">
          Statistik pemain &amp; klasemen hanya dihitung dari pertandingan
          berstatus <span className="font-medium text-slate-400">Resmi</span>.
          Skor akhir tetap diisi lewat “Input Hasil”.
        </p>
      </div>
    </div>
  );
}

// ================= Panel kelayakan =================
function EligibilityPanel({ matchId }) {
  const [elig, setElig] = useState(null);
  useEffect(() => {
    matchService
      .eligibility(matchId)
      .then(setElig)
      .catch(() => setElig([]));
  }, [matchId]);

  return (
    <div>
      {!elig ? (
        <p className="text-slate-600 text-xs">Memuat…</p>
      ) : (
        <div className="gap-3 grid sm:grid-cols-2">
          {[...new Set(elig.map((e) => e.team_name))].map((tn) => (
            <div
              key={tn}
              className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
              <p className="mb-1.5 font-semibold text-slate-200 text-sm">
                {tn}
              </p>
              <ul className="space-y-1">
                {elig
                  .filter((e) => e.team_name === tn)
                  .map((e) => (
                    <li
                      key={e.student_id}
                      className="flex justify-between items-center gap-2 text-xs">
                      <span
                        className={
                          e.suspended ? "text-slate-500" : "text-slate-300"
                        }>
                        {e.full_name}{" "}
                        {e.suspended && (
                          <span className="text-rose-300">⚠ Suspended</span>
                        )}
                      </span>
                      {e.suspended && (
                        <span className="max-w-[140px] text-[10px] text-rose-300/70 truncate">
                          {e.suspension_info}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
