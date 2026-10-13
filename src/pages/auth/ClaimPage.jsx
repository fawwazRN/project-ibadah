import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserCheck,
  LogOut,
  BadgeCheck,
  ChevronLeft,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Avatar } from "../../components/ui/Avatar";
import {
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../components/ui/States";
import { BrandMark } from "../../components/ui/BrandMark";
import { profileService } from "../../services/profileService";
import { homeFor } from "../../routes/AppRoutes";

export default function ClaimPage() {
  const { session, profile, claimProfile, signOut } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  // Wizard: langkah 1 pilih kelas → langkah 2 pilih nama
  const [step, setStep] = useState("class");
  const [kelas, setKelas] = useState("");
  const [q, setQ] = useState("");

  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setError(null);
    profileService
      .listClaimable()
      .then(setRows)
      .catch((e) => setError(e.message));
  };
  useEffect(load, []);

  // Admin yang baru terdeteksi dari admin_emails langsung diarahkan ke dashboard,
  // bukan diminta memilih kelas/nama santri.
  useEffect(() => {
    if (profile?.role && profile.role !== "santri") {
      navigate(homeFor(profile.role), { replace: true });
    }
  }, [profile, navigate]);

  // Kelas yang masih punya nama tersisa + jumlahnya
  const classes = useMemo(() => {
    if (!rows) return [];
    const map = new Map();
    for (const r of rows)
      map.set(r.class_name, (map.get(r.class_name) ?? 0) + 1);
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const namesInClass = useMemo(() => {
    if (!rows || !kelas) return [];
    return rows
      .filter((r) => r.class_name === kelas)
      .filter((r) => r.full_name.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [rows, kelas, q]);

  const submitClaim = async () => {
    setSaving(true);
    try {
      const p = await claimProfile(picked.id);
      push(
        "success",
        "Profil terhubung",
        `Selamat datang, ${picked.full_name}`,
      );
      // Arahkan sesuai peran hasil klaim (santri → /santri ·
      // calon admin yang terdaftar di admin_emails → dashboard perannya)
      navigate(homeFor(p?.role), { replace: true });
    } catch (e) {
      push("error", "Gagal menghubungkan profil", e.message);
      load();
      setPicked(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-page min-h-screen">
      <header className="bg-card border-line border-b">
        <div className="flex items-center gap-3 mx-auto px-4 lg:px-8 py-4 max-w-5xl">
          <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-9 text-brand-dim">
            <BrandMark className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-fg text-sm">
              Ibadah OSIS
            </p>
            <p className="text-[11px] text-fg-3 truncate">
              Masuk sebagai {session?.user?.email}
            </p>
          </div>
          <Button size="sm" variant="ghost" icon={LogOut} onClick={signOut}>
            Keluar
          </Button>
        </div>
      </header>

      <main className="mx-auto px-4 lg:px-8 py-8 max-w-5xl">
        {step === "class" ? (
          <>
            <div className="mb-6">
              <h1 className="font-display font-semibold text-fg text-2xl">
                Pilih Kelas Kamu
              </h1>
              <p className="mt-1 text-fg-3 text-sm">
                Langkah 1 dari 2 — pilih kelas, lalu kamu akan memilih namamu
                dari daftar kelas tersebut.
              </p>
            </div>

            {error ? (
              <ErrorState message={error} onRetry={load} />
            ) : !rows ? (
              <LoadingState rows={6} />
            ) : classes.length === 0 ? (
              <Card>
                <EmptyState
                  icon={BadgeCheck}
                  title="Tidak ada nama yang tersisa"
                  description="Semua profil santri sudah terklaim. Hubungi admin jika nama kamu seharusnya ada di daftar."
                />
              </Card>
            ) : (
              <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setKelas(c.name);
                      setQ("");
                      setStep("name");
                    }}
                    className="flex items-center gap-3 bg-soft hover:bg-brand/[0.05] shadow-card p-4 border border-line hover:border-brand/30 rounded-2xl text-left transition-colors">
                    <span className="place-items-center grid bg-soft border border-line rounded-xl size-10 text-brand-dim shrink-0">
                      <GraduationCap size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-fg text-sm truncate">
                        {c.name}
                      </p>
                      <p className="text-fg-3 text-xs">
                        {c.count} nama tersedia
                      </p>
                    </div>
                    <Badge tone={c.count > 3 ? "emerald" : "amber"}>
                      {c.count}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-5">
              <Button
                variant="ghost"
                size="sm"
                icon={ChevronLeft}
                className="mb-3 -ml-2"
                onClick={() => {
                  setStep("class");
                  setKelas("");
                  setQ("");
                }}>
                Ganti kelas
              </Button>
              <h1 className="font-display font-semibold text-fg text-2xl">
                Pilih Nama Kamu
              </h1>
              <p className="mt-1 text-fg-3 text-sm">
                Langkah 2 dari 2 — kelas{" "}
                <span className="font-medium text-fg-2">{kelas}</span> ·{" "}
                {namesInClass.length} nama tersedia. Pilihan hanya bisa
                dilakukan satu kali.
              </p>
            </div>

            <div className="relative mb-5 max-w-sm">
              <Search
                size={15}
                className="top-1/2 left-3 absolute text-fg-3 -translate-y-1/2"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari namamu…"
                className="pl-9"
                autoFocus
              />
            </div>

            {!rows ? (
              <LoadingState rows={6} />
            ) : namesInClass.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Search}
                  title="Tidak ditemukan"
                  description={
                    q
                      ? `Tidak ada nama yang cocok dengan “${q}” di kelas ini.`
                      : "Semua nama di kelas ini sudah terklaim."
                  }
                />
              </Card>
            ) : (
              <div className="gap-2 grid sm:grid-cols-2 lg:grid-cols-3">
                {namesInClass.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setPicked(r)}
                    className="flex items-center gap-3 bg-soft hover:bg-brand/[0.05] px-3 py-2.5 border border-line hover:border-brand/30 rounded-xl text-left transition-colors">
                    <Avatar name={r.full_name} size="sm" />
                    <p className="min-w-0 font-medium text-fg text-sm truncate">
                      {r.full_name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Modal
        open={!!picked}
        onClose={() => setPicked(null)}
        title="Konfirmasi"
        size="sm">
        {picked && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-soft p-3.5 border border-line rounded-xl">
              <Avatar name={picked.full_name} size="md" />
              <div>
                <p className="font-semibold text-fg text-sm">
                  {picked.full_name}
                </p>
                <p className="text-fg-3 text-xs">{picked.class_name}</p>
              </div>
            </div>
            <p className="text-fg-2 text-sm leading-relaxed">
              Pastikan ini benar-benar namamu. Setelah terhubung, pilihan{" "}
              <span className="font-medium text-fg">
                tidak bisa diubah lagi
              </span>{" "}
              dan semua data ibadah akan terkait dengan profil ini.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setPicked(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                icon={UserCheck}
                loading={saving}
                onClick={submitClaim}>
                Ya, Ini Saya
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
