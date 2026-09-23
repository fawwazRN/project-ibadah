import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserX,
  Trash2,
  KeyRound,
  ShieldAlert,
  Mail,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import { profileService } from "../../services/profileService";
import { OPEN_STATUSES, sumPoints, fmtNum } from "../../lib/calc";
import { fmtDate } from "../../lib/date";

export default function SantriManagement() {
  const { push } = useToast();
  const confirm = useConfirm();

  const [santri, setSantri] = useState(null);
  const [violations, setViolations] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [fClass, setFClass] = useState("");
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      profileService.listSantri(),
      violationService.list(),
      reportService.listAll(),
    ])
      .then(([s, v, r]) => {
        setSantri(s);
        setViolations(v);
        setReports(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Ringkasan per santri: total riwayat, pelanggaran aktif, poin aktif, laporan berjalan
  const perSantri = useMemo(() => {
    const m = {};
    for (const s of santri ?? [])
      m[s.id] = { total: 0, active: 0, points: 0, pending: 0 };
    for (const v of violations) {
      const e = m[v.santri_id];
      if (!e) continue;
      e.total++;
      if (OPEN_STATUSES.includes(v.status)) {
        e.active++;
        e.points += v.rule?.points ?? 0;
      }
    }
    for (const r of reports) {
      const e = m[r.santri_id];
      if (e && ["pending", "reviewing"].includes(r.status)) e.pending++;
    }
    return m;
  }, [santri, violations, reports]);

  // ---------- Aksi kelola akun / orang ----------
  const resetClaim = async (s) => {
    const ok = await confirm({
      title: "Reset klaim profil?",
      message: `Akun ${s.email} akan diputuskan dari nama “${s.full_name}”. Nama ini kembali bisa dipilih (diklaim) oleh akun mana pun. Riwayat pelanggaran & laporan tetap tersimpan di nama ini.`,
      confirmText: "Ya, reset klaim",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await profileService.adminResetClaim(s.id);
      push(
        "success",
        "Klaim direset",
        `${s.full_name} kembali tersedia untuk diklaim.`,
      );
      setDetail(null);
      load();
    } catch (e) {
      push("error", "Gagal reset klaim", e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async (s) => {
    const ok = await confirm({
      title: "Hapus akun (email & sandi)?",
      message: `Akun ${s.email} akan dihapus permanen dari sistem autentikasi. Profil “${s.full_name}” dan seluruh riwayatnya TETAP ada, lalu nama ini bisa diklaim lagi. Orang tersebut bisa mendaftar ulang kapan pun.`,
      confirmText: "Ya, hapus akun",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await profileService.adminDeleteAccount(s.id);
      push(
        "success",
        "Akun dihapus",
        `${s.email} tidak bisa login lagi. Profil tetap utuh.`,
      );
      setDetail(null);
      load();
    } catch (e) {
      push("error", "Gagal menghapus akun", e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteSantri = async (s) => {
    const ok = await confirm({
      title: "Hapus permanen profil santri?",
      message: `“${s.full_name}” akan dihapus dari daftar nama sekolah. Hanya bisa dilakukan karena santri ini belum punya riwayat apa pun. Tindakan ini tidak bisa dibatalkan.`,
      confirmText: "Ya, hapus permanen",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await profileService.adminDeleteSantri(s.id);
      push(
        "success",
        "Profil dihapus",
        `${s.full_name} dikeluarkan dari daftar.`,
      );
      setDetail(null);
      load();
    } catch (e) {
      push("error", "Gagal menghapus profil", e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!santri) return <LoadingState rows={7} />;

  const classes = [
    ...new Set(santri.map((s) => s.class_name).filter(Boolean)),
  ].sort();
  const list = santri.filter(
    (s) =>
      s.full_name.toLowerCase().includes(q.toLowerCase()) &&
      (!fClass || s.class_name === fClass),
  );

  const detailStats = detail
    ? (perSantri[detail.id] ?? { total: 0, active: 0, points: 0, pending: 0 })
    : null;
  const detailViolations = detail
    ? violations.filter((v) => v.santri_id === detail.id)
    : [];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Data Santri"
        description={`${santri.length} santri terdaftar beserta ringkasan kondisi ibadahnya.`}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative w-64">
          <Search
            size={14}
            className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama santri…"
            className="pl-8"
          />
        </div>
        <Select
          value={fClass}
          onChange={(e) => setFClass(e.target.value)}
          placeholder="Semua kelas"
          className="w-44"
          options={classes.map((c) => ({ value: c, label: `Kelas ${c}` }))}
        />
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Tidak ditemukan"
            description="Coba kata kunci atau filter lain."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Santri</Th>
                  <Th>Kelas</Th>
                  <Th>Akun Terhubung</Th>
                  <Th>Poin Aktif</Th>
                  <Th>Pelanggaran Aktif</Th>
                  <Th>Laporan Berjalan</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const m = perSantri[s.id] ?? {
                    points: 0,
                    active: 0,
                    pending: 0,
                  };
                  return (
                    <Tr key={s.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.full_name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-200 truncate">
                              {s.full_name}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {s.nis ?? "NIS —"}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-slate-300">{s.class_name}</Td>
                      <Td>
                        {s.user_id ? (
                          <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Mail
                              size={12}
                              className="text-slate-500 shrink-0"
                            />
                            <span className="max-w-[170px] truncate">
                              {s.email}
                            </span>
                          </span>
                        ) : (
                          <Badge tone="neutral">Belum terklaim</Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={m.points > 0 ? "rose" : "emerald"}>
                          {fmtNum(m.points)}
                        </Badge>
                      </Td>
                      <Td className="text-slate-300">{fmtNum(m.active)}</Td>
                      <Td className="text-slate-300">{fmtNum(m.pending)}</Td>
                      <Td className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(s)}>
                          Kelola
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.full_name : ""}
        size="lg">
        {detail && detailStats && (
          <div className="space-y-5">
            {/* Identitas */}
            <div className="flex items-center gap-3">
              <Avatar name={detail.full_name} size="md" />
              <div>
                <p className="font-semibold text-slate-100 text-sm">
                  {detail.full_name}
                </p>
                <p className="text-slate-500 text-xs">
                  Kelas {detail.class_name} · NIS {detail.nis ?? "—"}
                </p>
              </div>
            </div>

            {/* Ringkasan */}
            <div className="gap-2 grid grid-cols-3 text-center">
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Total Riwayat
                </p>
                <p className="mt-1 font-display font-semibold text-slate-100 text-lg">
                  {fmtNum(detailStats.total)}
                </p>
              </div>
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Poin Aktif
                </p>
                <p className="mt-1 font-display font-semibold text-rose-300 text-lg">
                  {fmtNum(detailStats.points)}
                </p>
              </div>
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Laporan Berjalan
                </p>
                <p className="mt-1 font-display font-semibold text-sky-300 text-lg">
                  {fmtNum(detailStats.pending)}
                </p>
              </div>
            </div>

            {/* Kelola akun */}
            <div className="bg-white/[0.02] p-4 border border-white/[0.06] rounded-xl">
              <p className="mb-1 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
                Kelola Akun
              </p>
              {detail.user_id ? (
                <>
                  <p className="flex items-center gap-1.5 mb-3 text-slate-400 text-xs">
                    <Mail size={12} className="text-slate-500" /> {detail.email}
                    <span className="text-slate-600">
                      · terklaim{" "}
                      {detail.claimed_at ? fmtDate(detail.claimed_at) : "—"}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={KeyRound}
                      loading={busy}
                      onClick={() => resetClaim(detail)}>
                      Reset Klaim
                    </Button>
                    <Button
                      size="sm"
                      variant="dangerSoft"
                      icon={UserX}
                      loading={busy}
                      onClick={() => deleteAccount(detail)}>
                      Hapus Akun
                    </Button>
                  </div>
                  <p className="mt-2.5 text-[11px] text-slate-600 leading-relaxed">
                    <span className="font-medium text-slate-500">
                      Reset Klaim
                    </span>{" "}
                    = lepas akun dari nama ini (nama bisa dipilih lagi).{" "}
                    <span className="font-medium text-slate-500">
                      Hapus Akun
                    </span>{" "}
                    = hapus email &amp; sandi dari sistem; profil &amp; riwayat
                    tetap ada.
                  </p>
                </>
              ) : (
                <p className="text-slate-500 text-xs">
                  <Badge tone="neutral" className="mr-2">
                    Belum terklaim
                  </Badge>
                  Nama ini belum dihubungkan dengan akun mana pun dan tersedia
                  di halaman pilih nama.
                </p>
              )}
            </div>

            {/* Hapus profil (hanya jika bersih) */}
            {detailStats.total === 0 && detailStats.pending === 0 && (
              <div className="bg-rose-500/[0.04] p-4 border border-rose-400/15 rounded-xl">
                <p className="flex items-center gap-1.5 mb-1 font-semibold text-[11px] text-rose-300 uppercase tracking-wider">
                  <ShieldAlert size={12} /> Zona Berbahaya
                </p>
                <p className="mb-3 text-slate-500 text-xs">
                  Santri ini belum punya riwayat apa pun, jadi profilnya boleh
                  dihapus permanen dari daftar nama.
                </p>
                <Button
                  size="sm"
                  variant="dangerSoft"
                  icon={Trash2}
                  loading={busy}
                  onClick={() => deleteSantri(detail)}>
                  Hapus Permanen Profil
                </Button>
              </div>
            )}

            {/* Riwayat */}
            <div>
              <p className="mb-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
                Riwayat Pelanggaran ({detailViolations.length})
              </p>
              {detailViolations.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Belum ada pelanggaran"
                  description="Santri ini bersih dari catatan pelanggaran."
                />
              ) : (
                <ul className="border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                  {detailViolations.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 text-sm truncate">
                          {v.rule?.name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {fmtDate(v.occurred_at)}
                        </p>
                      </div>
                      <Badge tone="rose">+{v.rule?.points}</Badge>
                      <ViolationStatusBadge status={v.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
