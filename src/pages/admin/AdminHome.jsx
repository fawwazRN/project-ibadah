import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader } from "../../components/ui/Card";
import { LoadingState } from "../../components/ui/States";
import { supabase } from "../../lib/supabaseClient";

export default function AdminHome() {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const [ctx, counts] = await Promise.all([
        supabase.rpc("get_league_context"),
        supabase
          .from("profiles")
          .select("role", { count: "exact", head: false }),
      ]);
      const byRole = {};
      for (const r of counts.data ?? [])
        byRole[r.role] = (byRole[r.role] ?? 0) + 1;
      setD({ ctx: ctx.data?.[0], byRole });
    })();
  }, []);
  if (!d) return <LoadingState rows={6} />;
  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Ringkasan Sistem"
        description="Kondisi lintas divisi."
      />
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard label="Santri" value={d.byRole.santri ?? 0} />
        <StatCard
          label="Qism Ibadah"
          value={d.byRole.qism_ibadah ?? 0}
          tone="emerald"
        />
        <StatCard
          label="Qism Riyadhah"
          value={d.byRole.qism_riyadhah ?? 0}
          tone="sky"
        />
        <StatCard
          label="Super Admin"
          value={d.byRole.super_admin ?? 0}
          tone="violet"
        />
      </div>
      {d.ctx && (
        <Card>
          <CardHeader
            title="Liga Riyadhah"
            description={`${d.ctx.phase_name} · ${d.ctx.season_name} · Pekan ${d.ctx.current_week}`}
          />
          <div className="flex flex-wrap gap-4 p-5 text-sm">
            <Link
              to="/riyadhah/standings"
              className="text-brand-soft hover:underline">
              Klasemen →
            </Link>
            <Link to="/admin/users" className="text-brand-soft hover:underline">
              Kelola Peran →
            </Link>
            <Link to="/admin/audit" className="text-brand-soft hover:underline">
              Log Audit →
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
