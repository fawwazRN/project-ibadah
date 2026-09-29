import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { LoadingState, ErrorState } from "../../components/ui/States";
import LughahRecapChart from "../../components/recap/LughahRecapChart";
import ExamSelector from "../../components/lughah/ExamSelector";
import { lughahService } from "../../services/lughahService";
import { fmtNum } from "../../lib/calc";

const BAR = "h-2.5 rounded-full";

export default function LughahRekapPage() {
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

  // Hooks dulu — stats setelahnya
  const stats = useMemo(() => {
    const list = rows ?? [];
    const total = list.length;
    const lengkap = list.filter((r) => r.is_complete).length;
    const scored = list.filter((r) => r.score != null).map((r) => r.score);
    return {
      total,
      lengkap,
      belum: total - lengkap,
      scored: scored.length,
      unscored: total - scored.length,
      avg: scored.length
        ? (scored.reduce((s, n) => s + n, 0) / scored.length).toFixed(1)
        : "—",
      max: scored.length ? Math.max(...scored) : "—",
      min: scored.length ? Math.min(...scored) : "—",
      setor: list.filter((r) => r.sudah_setor).length,
      ttd: list.filter((r) => r.sudah_tanda_tangan).length,
      buku: list.filter((r) => r.sudah_bawa_buku).length,
      tulis: list.filter((r) => r.sudah_lengkap_tulisan).length,
      dist: [
        { label: "90–100", total: scored.filter((n) => n >= 90).length },
        {
          label: "80–89",
          total: scored.filter((n) => n >= 80 && n <= 89).length,
        },
        {
          label: "70–79",
          total: scored.filter((n) => n >= 70 && n <= 79).length,
        },
        {
          label: "60–69",
          total: scored.filter((n) => n >= 60 && n <= 69).length,
        },
        { label: "<60", total: scored.filter((n) => n < 60).length },
      ],
    };
  }, [rows]);

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

  const pct = (n) => (stats.total ? Math.round((n / stats.total) * 100) : 0);
  const REQ = [
    { label: "Sudah setor", n: stats.setor },
    { label: "Sudah tanda tangan", n: stats.ttd },
    { label: "Sudah bawa buku", n: stats.buku },
    { label: "Sudah lengkap tulisan", n: stats.tulis },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Rekap Lughah"
        description="Kelengkapan ujian & nilai — periode terpilih."
      />

      <ExamSelector
        periods={periods}
        value={periodId}
        onChange={changePeriod}
      />

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Kelengkapan per syarat */}
      <Card>
        <CardHeader
          title="Kelengkapan per Syarat"
          description={`Dari ${stats.total} santri`}
        />
        <div className="space-y-4 p-5">
          {REQ.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-medium text-slate-300">{r.label}</span>
                <span className="font-mono text-slate-400">
                  {fmtNum(r.n)} / {fmtNum(stats.total)}
                </span>
              </div>
              <div
                className={BAR}
                style={{ background: "rgba(255,255,255,.06)" }}>
                <div
                  className={BAR}
                  style={{
                    width: `${pct(r.n)}%`,
                    background: "#10B981",
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                  }}
                />
              </div>
            </div>
          ))}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-semibold text-brand-soft">
                Kelengkapan keseluruhan
              </span>
              <span className="font-mono text-brand-soft">
                {fmtNum(stats.lengkap)} / {fmtNum(stats.total)}
              </span>
            </div>
            <div
              className={BAR}
              style={{ background: "rgba(255,255,255,.06)" }}>
              <div
                className={BAR}
                style={{
                  width: `${pct(stats.lengkap)}%`,
                  background: "#34D399",
                  printColorAdjust: "exact",
                  WebkitPrintColorAdjust: "exact",
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Nilai */}
      <div className="gap-4 grid lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Statistik Nilai"
            description="Dari santri yang sudah dinilai"
          />
          <div className="gap-4 grid grid-cols-2 p-5">
            <StatCard
              label="Rata-rata"
              value={stats.avg}
              icon={ClipboardCheck}
              tone="emerald"
            />
            <StatCard
              label="Tertinggi"
              value={stats.max}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Terendah"
              value={stats.min}
              icon={ClipboardCheck}
            />
            <StatCard
              label="Belum Dinilai"
              value={fmtNum(stats.unscored)}
              icon={Wallet}
              tone="amber"
            />
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Distribusi Nilai"
            description="Jumlah santri per rentang"
          />
          <div className="p-4">
            {stats.scored === 0 ? (
              <p className="py-8 text-slate-500 text-xs text-center italic">
                Belum ada santri yang dinilai.
              </p>
            ) : (
              <LughahRecapChart data={stats.dist} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
