import { Download, LogOut, ShieldCheck } from "lucide-react";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { ROLE_LABELS } from "../../lib/constants";
import { fmtDate } from "../../lib/date";

export default function ProfilePage({ role }) {
  const { profile, session, signOut } = useAuth();
  const confirm = useConfirm();
  const { canInstall, install, iosHint } = useInstallPrompt();
  if (!profile) return null;
  const isStaff = role !== "santri";

  return (
    <div className="max-w-2xl animate-fade-up">
      <PageHeader
        title="Profil"
        description="Informasi akun dan peran kamu dalam sistem."
      />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} size="lg" />
          <div>
            <h2 className="font-display font-semibold text-fg text-lg">
              {profile.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                tone={
                  role === "super_admin"
                    ? "violet"
                    : role === "santri"
                      ? "neutral"
                      : "emerald"
                }>
                {ROLE_LABELS[role] ?? role}
              </Badge>
              {!isStaff && profile.class_name && (
                <Badge tone="neutral">Kelas {profile.class_name}</Badge>
              )}
            </div>
          </div>
        </div>
        <dl className="gap-4 grid sm:grid-cols-2 mt-6 pt-5 border-line border-t text-sm">
          <div>
            <dt className="text-fg-3 text-xs">Email</dt>
            <dd className="mt-0.5 text-fg">
              {session?.user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-fg-3 text-xs">NIS</dt>
            <dd className="mt-0.5 font-mono text-fg">
              {profile.nis || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-fg-3 text-xs">Bergabung</dt>
            <dd className="mt-0.5 text-fg">
              {fmtDate(profile.created_at ?? Date.now())}
            </dd>
          </div>
          <div>
            <dt className="text-fg-3 text-xs">Kelas</dt>
            <dd className="mt-0.5 text-fg">
              {profile.class_name || "—"}
            </dd>
          </div>
        </dl>
        {!isStaff && (
          <p className="flex items-start gap-2 bg-soft mt-5 p-3 border border-line rounded-xl text-fg-3 text-xs leading-relaxed">
            <ShieldCheck
              size={14}
              className="mt-0.5 text-brand-dim shrink-0"
            />
            Privasi terjamin: kamu hanya dapat melihat data milikmu sendiri.
            Pembatasan ini diberlakukan di level database (Row Level Security),
            bukan hanya di tampilan.
          </p>
        )}
        <div className="mt-6 pt-5 border-line border-t">
          <Button
            variant="dangerSoft"
            icon={LogOut}
            onClick={async () => {
              if (
                await confirm({
                  title: "Keluar dari aplikasi?",
                  message: "Sesi kamu akan diakhiri.",
                  confirmText: "Keluar",
                  tone: "danger",
                })
              )
                await signOut();
            }}>
            Keluar dari akun
          </Button>
        </div>
      </Card>

      {(canInstall || iosHint) && (
        <Card className="flex items-center gap-4 mt-4 p-5">
          <span className="place-items-center grid bg-tint rounded-2xl size-12 text-brand-dim shrink-0">
            <Download size={22} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-fg text-sm">Pasang di layar utama</p>
            <p className="text-fg-3 text-xs leading-relaxed">
              {canInstall
                ? "Buka lebih cepat, tampil layar penuh seperti aplikasi."
                : "Di iPhone: ketuk Bagikan lalu Tambah ke Layar Utama."}
            </p>
          </div>
          {canInstall && (
            <Button variant="primary" size="sm" onClick={install}>
              Pasang
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
