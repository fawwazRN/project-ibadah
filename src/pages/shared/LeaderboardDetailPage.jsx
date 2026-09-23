import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Field";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { LeaderboardList } from "../../components/leaderboard/LeaderboardList";
import { leaderboardService } from "../../services/leaderboardService";

export default function LeaderboardDetailPage({ role }) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setError(null);
    leaderboardService
      .get()
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!entries) return <LoadingState rows={8} />;

  const filtered = entries.filter(
    (e) =>
      e.full_name.toLowerCase().includes(q.toLowerCase()) ||
      (e.class_name ?? "").toLowerCase().includes(q.toLowerCase()),
  );
  const base = role === "santri" ? "/santri" : "/ibadah";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Peringkat Lengkap"
        description={`Seluruh ${entries.length} santri diurutkan dari poin pelanggaran terbanyak — bulan berjalan.`}
        actions={
          <Link to={`${base}/leaderboard`}>
            <Button variant="ghost" icon={ChevronLeft}>
              Kembali
            </Button>
          </Link>
        }
      />
      <Card>
        <CardHeader
          title="Cari santri"
          actions={
            <div className="relative w-56">
              <Search
                size={14}
                className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nama atau kelas…"
                className="pl-8"
              />
            </div>
          }
        />
        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ditemukan"
            description="Coba kata kunci lain."
          />
        ) : (
          <LeaderboardList entries={filtered} meId={profile.id} />
        )}
      </Card>
    </div>
  );
}
