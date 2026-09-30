import { useCallback, useEffect, useState } from "react";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { eventService } from "../../services/eventService";

export default function InvitationSettingsPage() {
  const { push } = useToast();
  const [visible, setVisible] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    eventService
      .getSettings()
      .then((s) => setVisible(s.invitation_visible))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const toggle = async () => {
    setBusy(true);
    try {
      await eventService.setInvitationVisible(!visible);
      push(
        "success",
        visible ? "Undangan disembunyikan" : "Undangan ditayangkan",
      );
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (visible === null) return <LoadingState rows={3} />;

  return (
    <div className="max-w-2xl animate-fade-up">
      <PageHeader
        title="Undangan Acara"
        description="Kendalikan tayang-tidaknya halaman undangan. Saat disembunyikan, halaman menolak akses dan menu menghilang dari semua sidebar."
      />

      <Card>
        <CardHeader
          title="Visibilitas Undangan"
          description={
            visible ? "Saat ini: DITAYANGKAN" : "Saat ini: DISEMBUNYIKAN"
          }
        />
        <div className="p-5">
          <div
            className={`mb-4 flex flex-wrap items-center gap-4 rounded-2xl border p-5 ${
              visible
                ? "border-emerald-400/25 bg-emerald-500/[0.06]"
                : "border-rose-400/25 bg-rose-500/[0.06]"
            }`}>
            <span
              className={`grid size-12 place-items-center rounded-2xl border ${
                visible
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border-rose-400/25 bg-rose-400/10 text-rose-300"
              }`}>
              {visible ? <Eye size={22} /> : <EyeOff size={22} />}
            </span>
            <div className="flex-1">
              <p className="font-display font-bold text-slate-100 text-sm">
                {visible ? "Undangan sedang tayang" : "Undangan disembunyikan"}
              </p>
              <p className="mt-0.5 text-slate-500 text-xs leading-relaxed">
                {visible
                  ? "Halaman /undangan dapat diakses semua peran & tamu, dan menu muncul di semua sidebar."
                  : "Halaman /undangan menampilkan pesan dinonaktifkan, dan menu hilang dari semua sidebar — termasuk guest."}
              </p>
            </div>
            <Button
              variant={visible ? "dangerSoft" : "primary"}
              loading={busy}
              onClick={toggle}>
              {visible ? "Sembunyikan" : "Tayangkan"}
            </Button>
          </div>
          <p className="flex items-start gap-2 text-slate-500 text-xs leading-relaxed">
            <Sparkles size={13} className="mt-0.5 text-slate-600 shrink-0" />
            Data acara & RSVP tidak terpengaruh — yang disembunyikan hanya
            halamannya.
          </p>
        </div>
      </Card>
    </div>
  );
}
