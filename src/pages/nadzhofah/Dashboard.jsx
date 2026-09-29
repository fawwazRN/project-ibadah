import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Footprints,
  Plus,
  FileBarChart,
  CalendarDays,
  Users,
  Shirt,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { NyekerTable } from "../../components/nyeker/NyekerTable";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { nyekerService } from "../../services/nyekerService";
import { fmtNum } from "../../lib/calc";

export default function NadzhofahDashboard() {
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([nyekerService.stats(), nyekerService.list()])
      .then(([s, r]) => {
        setStats(s);
        setRows(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats || !rows) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Qism Nadzhofah"
        description="Monitoring kebersihan dan ketertiban santri."
        actions={
          <>
            <Link to="/nadzhofah/nyeker">
              <Button variant="primary" icon={Plus}>
                Catat Nyeker
              </Button>
            </Link>
            <Link to="/nadzhofah/pakaian">
              <Button variant="secondary" icon={Shirt}>
                Penyitaan
              </Button>
            </Link>
            <Link to="/nadzhofah/rekap">
              <Button variant="secondary" icon={FileBarChart}>
                Lihat Rekap
              </Button>
            </Link>
          </>
        }
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Hari Ini"
          value={fmtNum(stats.today)}
          icon={Footprints}
          tone="rose"
        />
        <StatCard
          label="Minggu Ini"
          value={fmtNum(stats.this_week)}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Bulan Ini"
          value={fmtNum(stats.this_month)}
          icon={FileBarChart}
          tone="sky"
        />
        <StatCard label="Total" value={fmtNum(stats.total)} icon={Footprints} />
        <StatCard
          label="Santri Tercatat"
          value={fmtNum(stats.students)}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader
          title="Catatan Terbaru"
          description="8 catatan terakhir"
          actions={
            <Link to="/nadzhofah/nyeker">
              <Button size="sm" variant="ghost" icon={Plus}>
                Catat Nyeker
              </Button>
            </Link>
          }
        />
        <NyekerTable rows={(rows ?? []).slice(0, 8)} />
      </Card>
    </div>
  );
}
