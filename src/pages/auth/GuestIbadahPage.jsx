import { useCallback, useEffect, useState } from "react";
import { Flag, Scale, Trophy, FileBarChart } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { supabase } from "../../lib/supabaseClient";
import { fmtNum } from "../../lib/calc";

const SCOPE_LABELS = { ibadah: "Qism Ibadah", riyadhah: "Qism Riyadhah" };

export default function GuestIbadahPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const [board, rules, recap, topRules] = await Promise.all([
        supabase.rpc("get_leaderboard"),
        supabase.rpc("list_public_rules"),
        supabase.rpc("get_public_ibadah_recap"),
        supabase.rpc("get_public_top_rules"),
      ]);
      setData({
        board: board.data ?? [],
        rules: rules.data ?? [],
        recap: recap.data?.[0] ?? null,
        topRules: topRules.data ?? [],
      });
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <LoadingState rows={8} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Qism Ibadah"
        description="Papan peringkat, aturan poin, dan rekap pelanggaran bulan berjalan."
      />

      {/* Rekap agregat */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pelanggaran Bulan Ini"
          value={fmtNum(data.recap?.total_violations ?? 0)}
          icon={Flag}
          tone="amber"
        />
        <StatCard
          label="Total Poin"
          value={fmtNum(data.recap?.total_points ?? 0)}
          icon={FileBarChart}
          tone="rose"
        />
        <StatCard
          label="Aturan Aktif"
          value={fmtNum(data.rules.length)}
          icon={Scale}
        />
        <StatCard
          label="Periode"
          value={data.recap?.month_label ?? "—"}
          icon={FileBarChart}
          tone="sky"
        />
      </div>

      {/* Papan peringkat nakal */}
      <Card>
        <CardHeader
          title="Papan Peringkat Nakal"
          description="Top 10 poin pelanggaran bulan ini — yang dibatalkan tidak dihitung"
          actions={<Trophy size={15} className="text-rose-300" />}
        />
        {data.board.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Belum ada data"
            description="Belum ada santri dengan poin bulan ini."
          />
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {data.board.slice(0, 10).map((e, i) => (
              <li
                key={e.santri_id}
                className="flex items-center gap-3 px-5 py-3">
                <span className="w-7 font-mono text-slate-500 text-sm shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Avatar name={e.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm truncate">
                    {e.full_name}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Kelas {e.class_name} · {fmtNum(e.violation_count)}{" "}
                    pelanggaran
                  </p>
                </div>
                <span className="font-mono font-semibold text-rose-300 text-sm">
                  {fmtNum(e.score)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="gap-4 grid lg:grid-cols-3">
        {/* Aturan poin */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Aturan Poin Aktif"
            description="Pelanggaran Qism Ibadah dicatat dengan waktu shalat · Qism Riyadhah dengan jam"
            actions={<Scale size={15} className="text-brand-soft" />}
          />
          {data.rules.length === 0 ? (
            <EmptyState icon={Scale} title="Belum ada aturan" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {data.rules.map((r) => (
                <li
                  key={r.name}
                  className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-sm">
                      {r.name}
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      {r.description || "—"}
                    </p>
                  </div>
                  <Badge tone={r.scope === "riyadhah" ? "sky" : "neutral"}>
                    {SCOPE_LABELS[r.scope] ?? r.scope}
                  </Badge>
                  <Badge tone="rose">+{r.points} poin</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Aturan tersering */}
        <Card>
          <CardHeader
            title="Paling Sering Terjadi"
            description="Bulan berjalan"
            actions={<FileBarChart size={15} className="text-slate-400" />}
          />
          {data.topRules.length === 0 ? (
            <EmptyState icon={FileBarChart} title="Belum ada data" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {data.topRules.map((r, i) => (
                <li
                  key={r.rule_name}
                  className="flex items-center gap-3 px-5 py-3">
                  <span className="font-mono text-slate-500 text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm truncate">
                      {r.rule_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {fmtNum(r.occurrences)} kejadian ·{" "}
                      {fmtNum(r.total_points)} poin
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
