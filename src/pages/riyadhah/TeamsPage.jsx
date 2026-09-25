import { useCallback, useEffect, useState } from "react";
import { UserPlus, Crown, UserMinus, Plus, Pencil } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { leagueService } from "../../services/leagueService";
import { teamService } from "../../services/teamService";
import { profileService } from "../../services/profileService";

export default function TeamsPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [ctx, setCtx] = useState(null);
  const [teams, setTeams] = useState([]);
  const [members, setMembers] = useState([]);
  const [santri, setSantri] = useState([]);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [mode, setMode] = useState(null); // 'member' | 'leader' | 'team' | 'rename'
  const [form, setForm] = useState({
    name: "",
    student_id: "",
    position: "pemain",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const c = await leagueService.getContext();
    setCtx(c);
    const [ts, ms, ss] = await Promise.all([
      leagueService.listTeams(c.phase_id),
      leagueService.listMemberships(c.season_id),
      profileService.listSantri(),
    ]);
    setTeams(ts ?? []);
    setMembers(ms ?? []);
    setSantri(ss ?? []);
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const openModal = (modeKey, team = null) => {
    setMode(modeKey);
    setSelectedTeam(team);
    setForm({
      name: modeKey === "rename" ? (team?.name ?? "") : "",
      student_id: "",
      position: "pemain",
    });
    setQ("");
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (mode === "team") {
        if (!form.name.trim()) throw new Error("Nama tim wajib diisi.");
        await teamService.createTeam(form.name.trim(), ctx.phase_id);
        push("success", "Tim dibuat", form.name);
      }
      if (mode === "rename") {
        if (!form.name.trim() || form.name.trim().length < 2)
          throw new Error("Nama tim minimal 2 karakter.");
        if (form.name.trim() !== selectedTeam.name) {
          await teamService.renameTeam(selectedTeam.id, form.name.trim());
          push(
            "success",
            "Nama tim diubah",
            `${selectedTeam.name} → ${form.name.trim()}`,
          );
        }
      }
      if (mode === "leader") {
        if (!form.student_id) throw new Error("Pilih santri.");
        await teamService.appointLeader(
          selectedTeam.id,
          form.student_id,
          ctx.phase_id,
        );
        push(
          "success",
          "Ketua ditunjuk",
          "Riwayat ketua sebelumnya tetap tersimpan.",
        );
      }
      if (mode === "member") {
        if (!form.student_id) throw new Error("Pilih santri.");
        await teamService.addMember(
          selectedTeam.id,
          form.student_id,
          ctx.season_id,
          form.position ?? "pemain",
        );
        push(
          "success",
          form.position === "kiper"
            ? "Kiper ditambahkan"
            : "Pemain ditambahkan",
        );
      }
      setMode(null);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    } finally {
      setSaving(false);
    }
  };

  const endMember = async (m) => {
    const ok = await confirm({
      title: "Akhiri keanggotaan?",
      message:
        "Santri keluar dari tim untuk musim ini. Riwayatnya tetap tersimpan.",
      confirmText: "Ya, akhiri",
      tone: "danger",
    });
    if (!ok) return;
    await teamService.endMember(m.id);
    push("success", "Keanggotaan diakhiri");
    load();
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!ctx) return <LoadingState rows={7} />;

  const filtered = santri.filter((s) =>
    s.full_name.toLowerCase().includes(q.toLowerCase()),
  );
  const modalTitle = {
    team: "Tambah Tim",
    rename: `Ubah Nama Tim — ${selectedTeam?.name ?? ""}`,
    leader: `Tunjuk Ketua — ${selectedTeam?.name ?? ""}`,
    member: `Tambah Anggota — ${selectedTeam?.name ?? ""}`,
  }[mode];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Tim & Pemain"
        description={`${ctx.phase_name} · ${ctx.season_name} — tiap tim: 1 kiper aktif + para pemain.`}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => openModal("team")}>
            Tambah Tim
          </Button>
        }
      />

      <div className="gap-4 grid md:grid-cols-2 xl:grid-cols-3">
        {teams.map((t) => {
          const tm = members.filter(
            (m) => m.team_id === t.id && m.status === "active",
          );
          return (
            <Card key={t.id}>
              <CardHeader
                title={t.name}
                description={
                  t.leader_name
                    ? `Ketua: ${t.leader_name}`
                    : "Ketua belum ditunjuk"
                }
                actions={
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Pencil}
                      onClick={() => openModal("rename", t)}
                      title="Ubah nama tim"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Crown}
                      onClick={() => openModal("leader", t)}
                      title="Tunjuk ketua"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={UserPlus}
                      onClick={() => openModal("member", t)}
                      title="Tambah anggota"
                    />
                  </div>
                }
              />
              {t.status === "relegated" && (
                <div className="px-5 pt-3">
                  <Badge tone="rose">Degradasi</Badge>
                </div>
              )}
              {tm.length === 0 ? (
                <EmptyState title="Belum ada anggota" />
              ) : (
                <ul className="divide-y divide-white/[0.04]">
                  {tm.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-2.5 px-5 py-2.5">
                      <Avatar name={m.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm truncate">
                          {m.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {m.class_name}
                        </p>
                      </div>
                      {m.player_position === "kiper" && (
                        <Badge tone="sky">Kiper</Badge>
                      )}
                      {m.suspended && <Badge tone="rose">⚠ Suspended</Badge>}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={UserMinus}
                        onClick={() => endMember(m)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={!!mode}
        onClose={() => setMode(null)}
        title={modalTitle}
        size="sm">
        <div className="space-y-4">
          {(mode === "team" || mode === "rename") && (
            <Field
              label="Nama tim"
              required
              hint={
                mode === "rename"
                  ? "Riwayat pertandingan & klasemen tetap menempel ke tim ini."
                  : undefined
              }>
              <Input
                value={form.name}
                autoFocus
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Mis. Team Elang"
              />
            </Field>
          )}
          {(mode === "leader" || mode === "member") && (
            <>
              <Field
                label="Cari santri"
                required
                hint="Ketik nama, lalu pilih dari daftar.">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ketik nama…"
                />
                <div className="bg-ink-800 mt-2 border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                  {filtered.slice(0, 10).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() =>
                        setForm((f) => ({ ...f, student_id: s.id }))
                      }
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 ${
                        form.student_id === s.id
                          ? "bg-brand/10 text-brand-soft"
                          : "text-slate-300"
                      }`}>
                      {s.full_name}{" "}
                      <span className="text-slate-500 text-xs">
                        {s.class_name}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
              {mode === "member" && (
                <Field
                  label="Posisi"
                  required
                  hint="Maksimal 1 kiper aktif per tim.">
                  <Select
                    value={form.position ?? "pemain"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, position: e.target.value }))
                    }
                    options={[
                      { value: "pemain", label: "Pemain" },
                      { value: "kiper", label: "Kiper" },
                    ]}
                  />
                </Field>
              )}
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode(null)}>
              Batal
            </Button>
            <Button variant="primary" loading={saving} onClick={submit}>
              {mode === "team"
                ? "Buat Tim"
                : mode === "rename"
                  ? "Simpan Nama Baru"
                  : mode === "leader"
                    ? "Tunjuk"
                    : "Tambah"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
