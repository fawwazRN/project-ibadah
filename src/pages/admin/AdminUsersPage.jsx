import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { ROLE_LABELS } from "../../lib/constants";

const ROLES = ["santri", "qism_ibadah", "qism_riyadhah", "super_admin"];
const ROLE_TONES = {
  santri: "neutral",
  qism_ibadah: "emerald",
  qism_riyadhah: "sky",
  super_admin: "violet",
};

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const { push } = useToast();
  const confirm = useConfirm();

  const [profiles, setProfiles] = useState(null);
  const [q, setQ] = useState("");
  const [fRole, setFRole] = useState("");
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError(null);
    supabase
      .from("profiles")
      .select("*")
      .order("role")
      .order("full_name")
      .then(({ data, error: e }) => {
        if (e) throw e;
        setProfiles(data ?? []);
      })
      .catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(
    () =>
      ROLES.reduce(
        (m, r) => ({
          ...m,
          [r]: profiles?.filter((p) => p.role === r).length ?? 0,
        }),
        {},
      ),
    [profiles],
  );

  const changeRole = async (p, role) => {
    if (role === p.role) return;
    const ok = await confirm({
      title: "Ubah peran?",
      message: `${p.full_name} → ${ROLE_LABELS[role]}.\n\nPerubahan langsung berlaku (akses menu & dashboard menyesuaikan) dan tercatat di log audit.`,
      confirmText: "Ya, ubah peran",
      tone: role === "super_admin" ? "danger" : "default",
    });
    if (!ok) return load();
    setBusyId(p.id);
    try {
      const { error: e } = await supabase.rpc("admin_set_role", {
        p_profile_id: p.id,
        p_role: role,
      });
      if (e) throw e;
      push(
        "success",
        "Peran diperbarui",
        `${p.full_name} → ${ROLE_LABELS[role]}`,
      );
      load();
    } catch (err) {
      push("error", "Gagal mengubah peran", err.message);
      load();
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profiles) return <LoadingState rows={8} />;

  const list = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(q.toLowerCase()) &&
      (!fRole || p.role === fRole),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Pengguna & Peran"
        description="Tunjuk siapa yang Full Admin, Qism Ibadah saja, Qism Riyadhah saja, atau Santri biasa. Peran ditentukan di database (RPC + RLS), bukan di aplikasi."
      />

      {/* Ringkasan per peran */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setFRole(fRole === r ? "" : r)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              fRole === r
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}>
            {ROLE_LABELS[r]}: {counts[r]}
          </button>
        ))}
        {fRole && (
          <button
            onClick={() => setFRole("")}
            className="text-slate-500 text-xs underline">
            hapus filter
          </button>
        )}
        <div className="relative ml-auto w-64">
          <Search
            size={14}
            className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama…"
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader
          title="Daftar Pengguna"
          description={`${list.length} profil`}
          actions={
            <Badge tone="violet">
              <ShieldCheck size={11} /> Kamu: {ROLE_LABELS[profile?.role]}
            </Badge>
          }
        />
        {list.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Tidak ditemukan"
            description="Coba kata kunci atau filter lain."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Nama</Th>
                  <Th>Kelas / NIS</Th>
                  <Th>Email</Th>
                  <Th>Peran</Th>
                  <Th className="text-right">Ubah Peran</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const isMe = p.id === profile?.id;
                  return (
                    <Tr key={p.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.full_name} size="sm" />
                          <span className="text-slate-200">{p.full_name}</span>
                          {isMe && <Badge tone="emerald">Kamu</Badge>}
                          {p.role === "santri" && !p.user_id && (
                            <Badge tone="neutral">Belum klaim</Badge>
                          )}
                        </div>
                      </Td>
                      <Td className="text-slate-500">
                        {p.role === "santri"
                          ? `${p.class_name ?? "—"}${p.nis ? ` · ${p.nis}` : ""}`
                          : "—"}
                      </Td>
                      <Td className="max-w-[220px] text-slate-500 truncate">
                        {p.email ?? "—"}
                      </Td>
                      <Td>
                        <Badge tone={ROLE_TONES[p.role]}>
                          {ROLE_LABELS[p.role]}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        {isMe ? (
                          <span className="text-slate-600 text-xs">
                            tidak bisa ubah diri sendiri
                          </span>
                        ) : (
                          <select
                            value={p.role}
                            disabled={busyId === p.id}
                            onChange={(e) => changeRole(p, e.target.value)}
                            className="py-1 w-auto text-xs field">
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="bg-ink-800">
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
