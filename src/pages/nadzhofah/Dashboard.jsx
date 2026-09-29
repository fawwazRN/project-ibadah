import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Footprints,
  Plus,
  FileBarChart,
  CalendarDays,
  Users,
  Shirt,
  Wallet,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { NyekerTable } from "../../components/nyeker/NyekerTable";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { nyekerService } from "../../services/nyekerService";
import { fmtNum } from "../../lib/calc";

const rp = (n) => `Rp ${fmtNum(n)}`;

export default function NadzhofahDashboard() {
  const { push } = useToast();
  const [stats, setStats] = useState(null);
  const [fines, setFines] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      nyekerService.stats(),
      nyekerService.fineStats(),
      nyekerService.list(),
    ])
      .then(([s, f, r]) => {
        setStats(s);
        setFines(f);
        setRows(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Tandai lunas / belum
  const togglePaid = async (r) => {
    try {
      await nyekerService.setFinePaid(r.id, !r.fine_paid);
      push(
        "success",
        r.fine_paid ? "Denda ditandai belum lunas" : "Denda ditandai LUNAS",
        `${r.full_name} · ${rp(r.fine_amount)}`,
      );
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats || !fines || !rows) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Qism Nadzhofah"
        description="Monitoring kebersihan, ketertiban, dan denda nyeker."
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

      {/* Statistik nyeker */}
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

      {/* Statistik denda */}
      <Card>
        <CardHeader
          title="Denda Nyeker"
          description="Standar 5.000/catatan · klik status di tabel untuk tandai lunas"
          actions={<Wallet size={15} className="text-brand-soft" />}
        />
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 p-5">
          <StatCard
            label="Belum Lunas"
            value={rp(fines.unpaid)}
            icon={CircleDashed}
            tone="rose"
          />
          <StatCard
            label="Sudah Lunas"
            value={rp(fines.paid)}
            icon={CircleCheck}
            tone="emerald"
          />
          <StatCard
            label="Total Denda"
            value={rp(fines.total_fine)}
            icon={Wallet}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Catatan Terbaru"
          description="8 catatan terakhir — klik ikon ceklis utk tandai lunas"
        />
        <NyekerTable
          rows={(rows ?? []).slice(0, 8)}
          onTogglePaid={togglePaid}
        />
      </Card>
    </div>
  );
}
