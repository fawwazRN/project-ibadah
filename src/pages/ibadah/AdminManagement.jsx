import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Info } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Select } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../components/ui/States";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { profileService } from "../../services/profileService";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_ROLES = [
  { value: "qism_ibadah", label: "Qism Ibadah" },
  { value: "qism_riyadhah", label: "Qism Riyadhah" },
  { value: "super_admin", label: "Super Admin" },
];
const ROLE_TONES = {
  qism_ibadah: "emerald",
  qism_riyadhah: "sky",
  super_admin: "violet",
};

export default function AdminManagement() {
  const { profile } = useAuth();
  const { push } = useToast();
  const confirm = useConfirm();

  const [emails, setEmails] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("qism_ibadah");
  const [emailError, setEmailError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      profileService.listAdminEmails(),
      profileService.listAllProfiles(),
    ])
      .then(([e, p]) => {
        setEmails(e);
        setProfiles(p);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const rows = useMemo(
    () =>
      (emails ?? []).map((a) => ({
        ...a,
        profile:
          profiles.find((x) => (x.email ?? "").toLowerCase() === a.email) ??
          null,
      })),
    [emails, profiles],
  );

  const addAdmin = async () => {
    const value = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailError("Masukkan email yang valid.");
      return;
    }
    if (rows.some((r) => r.email === value)) {
      setEmailError("Email sudah terdaftar sebagai admin.");
      return;
    }
    setSaving(true);
    setEmailError("");
    try {
      await profileService.addAdminEmail(value, role, profile?.id);
      push(
        "success",
        "Calon admin didaftarkan",
        "Begitu dia daftar akun & memilih namanya, perannya otomatis aktif.",
      );
      setEmail("");
      load();
    } catch (e) {
      push("error", "Gagal menambah admin", e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeAdmin = async (row) => {
    if (row.email === (profile?.email ?? "").toLowerCase()) {
      push("error", "Tidak bisa menghapus diri sendiri");
      return;
    }
    const ok = await confirm({
      title: "Hapus dari daftar admin?",
      message: `${row.email} tidak akan otomatis jadi admin lagi. Jika akunnya sudah aktif sebagai staff, perannya juga dikembalikan menjadi santri.`,
      confirmText: "Ya, hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await profileService.removeAdminEmail(row.email);
      push("success", "Dihapus dari daftar admin", row.email);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!emails) return <LoadingState rows={4} />;

  return (
    <div className="max-w-4xl animate-fade-up">
      <PageHeader
        title="Daftar Calon Admin"
        description="Email di daftar ini, begitu mendaftar akun dan memilih namanya, otomatis mendapat peran yang ditentukan."
      />

      <Card className="mb-5 p-5">
        <p className="mb-3 font-medium text-slate-200 text-sm">
          Tambah Calon Admin
        </p>
        <div className="flex sm:flex-row flex-col sm:items-start gap-3">
          <div className="flex-1">
            <Field
              error={emailError}
              hint="Alurnya: daftarkan email di sini → orang tsb membuat akun → memilih namanya → otomatis menjadi admin.">
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="email@student.abudzar.sch.id"
              />
            </Field>
          </div>
          <div className="w-full sm:w-44">
            <Field label="Peran">
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                options={ADMIN_ROLES}
              />
            </Field>
          </div>
          <Button
            variant="primary"
            icon={UserPlus}
            loading={saving}
            onClick={addAdmin}
            className="sm:mt-6">
            Tambah
          </Button>
        </div>
        <p className="flex items-start gap-2 mt-3 text-slate-500 text-xs leading-relaxed">
          <Info size={13} className="mt-0.5 text-slate-600 shrink-0" />
          Untuk peran Super Admin gunakan secukupnya — aksesnya penuh ke semua
          divisi.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Daftar Calon Admin"
          description={`${rows.length} email terdaftar`}
        />
        {rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Belum ada calon admin" />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Peran Ditugaskan</Th>
                  <Th>Status Akun</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Tr key={r.email}>
                    <Td className="text-slate-200">
                      {r.email}
                      {r.email === (profile?.email ?? "").toLowerCase() && (
                        <Badge tone="emerald" className="ml-2">
                          Kamu
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={ROLE_TONES[r.role] ?? "neutral"}>
                        {r.role}
                      </Badge>
                    </Td>
                    <Td>
                      {r.profile?.user_id ? (
                        <Badge tone="emerald">Aktif — {r.profile.role}</Badge>
                      ) : r.profile ? (
                        <Badge tone="amber">Belum klaim nama</Badge>
                      ) : (
                        <Badge tone="neutral">Belum mendaftar</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="dangerSoft"
                        icon={Trash2}
                        onClick={() => removeAdmin(r)}>
                        Hapus
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
