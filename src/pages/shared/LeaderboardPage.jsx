import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { TopThree } from "../../components/leaderboard/TopThree";
import { LeaderboardList } from "../../components/leaderboard/LeaderboardList";
import { leaderboardService } from "../../services/leaderboardService";
import { fmtNum } from "../../lib/calc";

export default function LeaderboardPage({ role }) {
  const { profile } = useAuth();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    leaderboardService
      .get()
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!entries) return <LoadingState rows={6} />;

  const isSantri = role === "santri";
  const myIndex = isSantri
    ? entries.findIndex((e) => e.santri_id === profile.id)
    : -1;
  const base = isSantri ? "/santri" : "/ibadah";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Papan Peringkat Nakal"
        description="Top 10 santri dengan akumulasi poin pelanggaran terbanyak bulan ini. Poin yang dibatalkan tidak dihitung."
        actions={
          <Link to={`${base}/leaderboard/detail`}>
            <Button variant="secondary" icon={ChevronRight}>
              Peringkat lengkap
            </Button>
          </Link>
        }
      />

      {entries.length < 3 ? (
        <Card>
          <EmptyState
            icon={Flame}
            title="Data belum cukup"
            description="Papan tampil setelah ada minimal 3 santri berpoin bulan ini."
          />
        </Card>
      ) : (
        <>
          <TopThree entries={entries} meId={isSantri ? profile.id : null} />
          <Card className="mt-4">
            <CardHeader
              title="Peringkat 4–10"
              description="Diurutkan dari poin terbanyak — bulan berjalan"
            />
            <LeaderboardList
              entries={entries.slice(3, 10)}
              startRank={4}
              meId={isSantri ? profile.id : null}
            />
          </Card>
          {isSantri &&
            (myIndex >= 0 ? (
              <Card className="flex items-center gap-4 mt-4 p-5 border-rose-400/25">
                <span className="place-items-center grid bg-rose-400/10 border border-rose-400/25 rounded-xl size-11 font-display font-bold text-rose-300 text-base">
                  #{myIndex + 1}
                </span>
                <div>
                  <p className="font-medium text-slate-200 text-sm">
                    Peringkat kamu dari {entries.length} santri
                  </p>
                  <p className="text-slate-500 text-xs">
                    {fmtNum(entries[myIndex].score)} poin ·{" "}
                    {fmtNum(entries[myIndex].violation_count)} pelanggaran
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="mt-4 p-5 text-slate-400 text-sm">
                Kamu belum memiliki poin pelanggaran bulan ini. Pertahankan.
              </Card>
            ))}
        </>
      )}
    </div>
  );
}
