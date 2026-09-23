import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { fmtDate } from "../../lib/date";

export default function ProfilePage({ role }) {
  const { profile, session, signOut } = useAuth();
  const confirm = useConfirm();
  if (!profile) return null;
  const isOsis = role === "osis_ibadah";

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
            <h2 className="font-display font-semibold text-slate-50 text-lg">
              {profile.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={isOsis ? "emerald" : "neutral"}>
                {isOsis ? "OSIS Qism Ibadah" : "Santri"}
              </Badge>
              {!isOsis && profile.class_name && (
                <Badge tone="neutral">Kelas {profile.class_name}</Badge>
              )}
            </div>
          </div>
        </div>
        <dl className="gap-4 grid sm:grid-cols-2 mt-6 pt-5 border-white/[0.06] border-t text-sm">
          <div>
            <dt className="text-slate-500 text-xs">Email</dt>
            <dd className="mt-0.5 text-slate-200">
              {session?.user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">NIS</dt>
            <dd className="mt-0.5 font-mono text-slate-200">
              {profile.nis || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Bergabung</dt>
            <dd className="mt-0.5 text-slate-200">
              {fmtDate(profile.created_at ?? Date.now())}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Kelas</dt>
            <dd className="mt-0.5 text-slate-200">
              {profile.class_name || "—"}
            </dd>
          </div>
        </dl>
        {!isOsis && (
          <p className="flex items-start gap-2 bg-white/[0.02] mt-5 p-3 border border-white/[0.06] rounded-xl text-slate-500 text-xs leading-relaxed">
            <ShieldCheck
              size={14}
              className="mt-0.5 text-brand-soft shrink-0"
            />
            Privasi terjamin: kamu hanya dapat melihat data milikmu sendiri.
            Pembatasan ini diberlakukan di level database (Row Level Security),
            bukan hanya di tampilan.
          </p>
        )}
        <div className="mt-6 pt-5 border-white/[0.06] border-t">
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
    </div>
  );
}
