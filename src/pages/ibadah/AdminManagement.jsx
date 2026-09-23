import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, UserPlus, Trash2, Info } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
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

export default function AdminManagement() {
  const { profile } = useAuth();
  const { push } = useToast();
  const confirm = useConfirm();

  const [emails, setEmails] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
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

  // Gabungkan: email admin + status pendaftarannya (sudah/belum punya akun)
  const rows = useMemo(
    () =>
      (emails ?? []).map((a) => {
        const p = profiles.find(
          (x) => (x.email ?? "").toLowerCase() === a.email,
        );
        return { ...a, profile: p ?? null };
      }),
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
      await profileService.addAdminEmail(value, profile?.id);
      push("success", "Admin ditambahkan", value);
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
      push(
        "error",
        "Tidak bisa menghapus diri sendiri",
        "Minta admin lain untuk mencabut aksesmu.",
      );
      return;
    }
    const ok = await confirm({
      title: "Hapus akses admin?",
      message: `${row.email} akan kehilangan akses OSIS Ibadah. Jika akunnya terdaftar, perannya dikembalikan menjadi santri. Riwayat tindakannya di log audit tetap tersimpan.`,
      confirmText: "Ya, hapus akses",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await profileService.removeAdminEmail(row.email);
      push("success", "Akses admin dicabut", row.email);
      load();
    } catch (e) {
      push("error", "Gagal menghapus admin", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!emails) return <LoadingState rows={4} />;

  return (
    <div className="max-w-4xl animate-fade-up">
      <PageHeader
        title="Kelola Admin"
        description="Email yang terdaftar di sini otomatis mendapatkan akses OSIS Qism Ibadah."
      />

      <Card className="mb-5 p-5">
        <p className="mb-3 font-medium text-slate-200 text-sm">Tambah Admin</p>
        <div className="flex sm:flex-row flex-col sm:items-start gap-3">
          <div className="flex-1">
            <Field
              error={emailError}
              hint="Bila email belum pernah mendaftar, dia otomatis menjadi admin saat pertama kali mendaftar di aplikasi.">
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
          Hanya email di daftar ini yang mendapat peran admin — peran ditentukan
          database (trigger + RLS), bukan oleh aplikasi.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Daftar Admin"
          description={`${rows.length} email terdaftar`}
        />
        {rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Belum ada admin" />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Peran Saat Ini</Th>
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
                      {r.profile ? (
                        <Badge tone="emerald">Akun terdaftar</Badge>
                      ) : (
                        <Badge tone="amber">Menunggu mendaftar</Badge>
                      )}
                    </Td>
                    <Td className="text-slate-400">
                      {r.profile
                        ? r.profile.role === "osis_ibadah"
                          ? "OSIS Ibadah"
                          : "Santri"
                        : "—"}
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
