import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpenCheck,
  Flag,
  Footprints,
  History,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Volleyball,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/States";
import { supabase } from "../../lib/supabaseClient";
import { reportService } from "../../services/reportService";
import { nyekerService } from "../../services/nyekerService";
import { fmtNum } from "../../lib/calc";

const ok = (r) => (r.status === "fulfilled" ? r.value : null);

function Attention({ icon: Icon, tone, value, label, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 bg-card hover:shadow-md p-4 border border-line hover:border-line-2 rounded-xl transition">
      <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-fg text-2xl leading-none">{value}</p>
        <p className="mt-1 text-fg-3 text-xs">{label}</p>
      </div>
      <ArrowUpRight size={16} className="text-fg-4 group-hover:text-fg-2 transition-colors" />
    </Link>
  );
}

const QISM = [
  { q: "q-ibadah", to: "/ibadah", icon: Flag, name: "Qism Ibadah", desc: "Pelanggaran, poin & klarifikasi", role: "qism_ibadah" },
  { q: "q-riyadhah", to: "/riyadhah", icon: Volleyball, name: "Qism Riyadhah", desc: "Liga, klasemen & suspensi", role: "qism_riyadhah" },
  { q: "q-nadzhofah", to: "/nadzhofah", icon: Footprints, name: "Qism Nadzhofah", desc: "Nyeker, denda & penyitaan", role: "nadzhofah" },
  { q: "q-lughah", to: "/lughah", icon: BookOpenCheck, name: "Qism Lughah", desc: "Kelengkapan ujian & nilai", role: "lughah" },
];

const TOOLS = [
  { to: "/admin/users", icon: Users, label: "Pengguna & Peran" },
  { to: "/admin/admins", icon: ShieldCheck, label: "Calon Admin" },
  { to: "/admin/invitation", icon: Sparkles, label: "Undangan" },
  { to: "/admin/audit", icon: History, label: "Log Audit" },
  { to: "/admin/settings", icon: Settings, label: "Pengaturan Liga" },
];

export default function AdminHome() {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const [ctx, counts, reps, fines] = await Promise.allSettled([
        supabase.rpc("get_league_context"),
        supabase.from("profiles").select("role", { count: "exact", head: false }),
        reportService.listAll(),
        nyekerService.fineStats(),
      ]);
      const byRole = {};
      for (const r of ok(counts)?.data ?? []) byRole[r.role] = (byRole[r.role] ?? 0) + 1;
      const pending = (ok(reps) ?? []).filter((r) =>
        ["pending", "reviewing"].includes(r.status),
      );
      setD({
        ctx: ok(ctx)?.data?.[0],
        byRole,
        pending,
        unpaid: ok(fines)?.unpaid ?? null,
      });
    })();
  }, []);

  if (!d) return <LoadingState rows={6} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Kendali"
        description="Apa yang perlu ditindak hari ini, lintas qism."
      />

      <section aria-label="Perlu perhatian" className="gap-3 grid sm:grid-cols-2 lg:grid-cols-3">
        <Attention
          icon={MessageSquareWarning}
          tone="bg-amber-100 text-amber-700"
          value={fmtNum(d.pending.length)}
          label="Laporan klarifikasi menunggu tinjauan"
          to="/ibadah/reports"
        />
        <Attention
          icon={Wallet}
          tone="bg-orange-100 text-orange-700"
          value={d.unpaid == null ? "—" : `Rp ${fmtNum(d.unpaid)}`}
          label="Denda nyeker belum lunas"
          to="/nadzhofah"
        />
        <Attention
          icon={Users}
          tone="bg-sky-100 text-sky-700"
          value={fmtNum(d.byRole.santri ?? 0)}
          label="Santri terdaftar"
          to="/admin/users"
        />
      </section>

      <section aria-label="Qism" className="gap-3 grid sm:grid-cols-2 xl:grid-cols-4">
        {QISM.map((x) => (
          <Link key={x.to} to={x.to} className={`${x.q} card-press p-4`}>
            <div className="flex justify-between items-start">
              <span className="q-chip rounded-xl size-10">
                <x.icon size={19} strokeWidth={2.3} />
              </span>
              <span className="text-fg-3 text-xs">
                {fmtNum(d.byRole[x.role] ?? 0)} admin
              </span>
            </div>
            <p className="mt-3 font-bold text-fg text-sm">{x.name}</p>
            <p className="mt-0.5 text-fg-3 text-xs">{x.desc}</p>
          </Link>
        ))}
      </section>

      <div className="gap-4 grid lg:grid-cols-3">
        {d.ctx && (
          <Card className="lg:col-span-2">
            <CardHeader
              title="Liga Riyadhah"
              description={`${d.ctx.phase_name} · ${d.ctx.season_name} · Pekan ${d.ctx.current_week}`}
              actions={
                <Link to="/riyadhah/standings" className="btn btn-secondary btn-sm">
                  Klasemen
                </Link>
              }
            />
            <div className="gap-4 grid grid-cols-3 p-5 text-center">
              <div>
                <p className="font-bold text-fg text-2xl">{d.ctx.teams_count}</p>
                <p className="text-fg-3 text-xs">Tim aktif</p>
              </div>
              <div>
                <p className="font-bold text-fg text-2xl">{d.ctx.matches_official}</p>
                <p className="text-fg-3 text-xs">Laga resmi</p>
              </div>
              <div>
                <p className="font-bold text-fg text-2xl">
                  {d.ctx.matches_total - d.ctx.matches_official}
                </p>
                <p className="text-fg-3 text-xs">Sisa laga</p>
              </div>
            </div>
          </Card>
        )}
        <Card className={d.ctx ? "" : "lg:col-span-3"}>
          <CardHeader title="Pengelolaan sistem" />
          <ul className="p-2">
            {TOOLS.map((t) => (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className="flex items-center gap-2.5 hover:bg-soft-2 px-3 py-2 rounded-lg text-fg-2 text-[13px] font-semibold">
                  <t.icon size={15} className="text-fg-3" /> {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
