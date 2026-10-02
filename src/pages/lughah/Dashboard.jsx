import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Wallet,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import ExamSelector from "../../components/lughah/ExamSelector";
import { lughahService } from "../../services/lughahService";
import { fmtNum } from "../../lib/calc";
import InvitationCard from "../../components/event/InvitationCard";

const FIELD_LABELS = {
  sudah_setor: "Setor",
  sudah_tanda_tangan: "Tanda tangan",
  sudah_bawa_buku: "Buku",
  sudah_lengkap_tulisan: "Tulisan",
};

export default function LughahDashboard() {
  const [periods, setPeriods] = useState(null);
  const [periodId, setPeriodId] = useState(
    () => localStorage.getItem("lughah.period") ?? "",
  );
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    lughahService
      .listPeriods()
      .then((ps) => {
        setPeriods(ps);
        if (!periodId) {
          const saved = localStorage.getItem("lughah.period");
          const pick =
            ps.find((p) => p.id === saved) ??
            ps.find((p) => p.is_current) ??
            ps[0];
          if (pick) setPeriodId(pick.id);
        }
      })
      .catch((e) => setError(e.message));
  }, []); // eslint-disable-line

  const loadRows = useCallback(() => {
    if (!periodId) return;
    setError(null);
    lughahService
      .completion(periodId)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [periodId]);
  useEffect(loadRows, [loadRows]);

  const changePeriod = (id) => {
    setPeriodId(id);
    localStorage.setItem("lughah.period", id);
  };

  // ================= SEMUA HOOKS DULU =================
  const stats = useMemo(() => {
    const list = rows ?? [];
    const scored = list.filter((r) => r.score != null).map((r) => r.score);
    const belum = list.filter((r) => !r.is_complete);
    return {
      total: list.length,
      lengkap: list.filter((r) => r.is_complete).length,
      belum: belum.length,
      scored: scored.length,
      unscored: list.length - scored.length,
      avg: scored.length
        ? (scored.reduce((s, n) => s + n, 0) / scored.length).toFixed(1)
        : "—",
      belumList: belum.slice(0, 8),
      missingLabel: (r) =>
        [
          "sudah_setor",
          "sudah_tanda_tangan",
          "sudah_bawa_buku",
          "sudah_lengkap_tulisan",
        ]
          .filter((f) => !r[f])
          .map((f) => FIELD_LABELS[f])
          .join(", "),
      latest: [...list]
        .filter((r) => r.score != null && r.updated_at)
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        .slice(0, 5),
    };
  }, [rows]);

  // ================= EARLY RETURN SETELAH HOOKS =================
  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          loadRows();
        }}
      />
    );
  if (!periods) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Qism Lughah"
        description="Monitoring kelengkapan ujian dan nilai santri."
      />

      <ExamSelector
        periods={periods}
        value={periodId}
        onChange={changePeriod}
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Santri"
          value={fmtNum(stats.total)}
          icon={Users}
        />
        <StatCard
          label="Lengkap"
          value={fmtNum(stats.lengkap)}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Belum Lengkap"
          value={fmtNum(stats.belum)}
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Sudah Dinilai"
          value={fmtNum(stats.scored)}
          icon={ClipboardCheck}
          tone="sky"
        />
        <StatCard
          label="Belum Dinilai"
          value={fmtNum(stats.unscored)}
          icon={Wallet}
        />
        <StatCard
          label="Rata-rata Nilai"
          value={stats.avg}
          icon={ClipboardCheck}
          tone="emerald"
        />
      </div>

      <div className="gap-4 grid lg:grid-cols-2">
        {/* Santri belum lengkap */}
        <Card>
          <CardHeader
            title="Santri Belum Lengkap"
            description="Persyaratan yang masih kurang"
            actions={
              <Link to="/lughah/kelengkapan">
                <Button size="sm" variant="ghost" icon={ChevronRight}>
                  Lihat Semua
                </Button>
              </Link>
            }
          />
          {stats.belum === 0 ? (
            <p className="px-5 pb-5 text-emerald-300 text-sm">
              Semua santri sudah lengkap. Alhamdulillah.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {stats.belumList.map((r) => (
                <li
                  key={r.student_id}
                  className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-sm truncate">
                      {r.full_name}
                    </p>
                    <p className="flex flex-wrap items-center gap-1 text-[11px] text-rose-300">
                      {[
                        "sudah_setor",
                        "sudah_tanda_tangan",
                        "sudah_bawa_buku",
                        "sudah_lengkap_tulisan",
                      ]
                        .filter((f) => !r[f])
                        .map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-0.5">
                            <X size={10} /> {FIELD_LABELS[f]}
                          </span>
                        ))}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Nilai terbaru */}
        <Card>
          <CardHeader
            title="Nilai Terbaru"
            description="5 pembaruan terakhir"
            actions={
              <Link to="/lughah/nilai">
                <Button size="sm" variant="ghost" icon={ChevronRight}>
                  Lihat Semua
                </Button>
              </Link>
            }
          />
          {stats.latest.length === 0 ? (
            <p className="px-5 pb-5 text-slate-500 text-sm">
              Belum ada nilai yang diinput.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {stats.latest.map((r) => (
                <li
                  key={r.student_id}
                  className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 text-sm truncate">
                      {r.full_name}
                    </p>
                    <p className="text-[11px] text-slate-500">{r.class_name}</p>
                  </div>
                  <span className="font-mono font-bold text-brand-soft">
                    {r.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="gap-3 grid grid-cols-2 lg:grid-cols-3">
        {[
          {
            to: "/lughah/kelengkapan",
            label: "Kelengkapan",
            desc: "Centang 4 syarat ujian",
          },
          {
            to: "/lughah/nilai",
            label: "Nilai",
            desc: "Input & edit nilai santri",
          },
          {
            to: "/lughah/rekap",
            label: "Rekap",
            desc: "Statistik & distribusi nilai",
          },
        ].map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="flex items-center gap-3 p-4 hover:border-brand/30 transition-colors">
              <span className="place-items-center grid bg-white/[0.03] border border-white/[0.07] rounded-lg size-9 text-brand-soft shrink-0">
                <ClipboardCheck size={16} />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-slate-200 text-sm truncate">
                  {c.label}
                </p>
                <p className="text-slate-500 text-xs truncate">{c.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
