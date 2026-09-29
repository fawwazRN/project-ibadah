import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input, Select } from "../../components/ui/Field";
import { LoadingState, ErrorState } from "../../components/ui/States";
import ExamSelector from "../../components/lughah/ExamSelector";
import ScoreTable from "../../components/lughah/ScoreTable";
import ScoreInput from "../../components/lughah/ScoreInput";
import { lughahService } from "../../services/lughahService";

export default function LughahNilaiPage() {
  const [periods, setPeriods] = useState(null);
  const [periodId, setPeriodId] = useState(
    () => localStorage.getItem("lughah.period") ?? "",
  );
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [fClass, setFClass] = useState("");
  const [editFor, setEditFor] = useState(null);

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
      .scores(periodId)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [periodId]);
  useEffect(loadRows, [loadRows]);

  const changePeriod = (id) => {
    setPeriodId(id);
    localStorage.setItem("lughah.period", id);
  };

  const saveScore = async (studentId, score) => {
    await lughahService.setScore(studentId, periodId, score);
    loadRows();
  };

  // Hooks dulu — filter setelahnya
  const scoped = useMemo(() => {
    let list = rows ?? [];
    if (q)
      list = list.filter((r) =>
        r.full_name.toLowerCase().includes(q.toLowerCase()),
      );
    if (fClass) list = list.filter((r) => r.class_name === fClass);
    return list;
  }, [rows, q, fClass]);

  const classes = useMemo(
    () =>
      [
        ...new Set((rows ?? []).map((r) => r.class_name).filter(Boolean)),
      ].sort(),
    [rows],
  );

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
        title="Nilai Ujian"
        description="Klik nama santri untuk menginput atau mengubah nilai (0–100)."
      />

      <ExamSelector
        periods={periods}
        value={periodId}
        onChange={changePeriod}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search
            size={14}
            className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama…"
            className="pl-8"
          />
        </div>
        <Select
          value={fClass}
          onChange={(e) => setFClass(e.target.value)}
          placeholder="Semua kelas"
          className="w-44"
          options={classes.map((c) => ({ value: c, label: `Kelas ${c}` }))}
        />
      </div>

      <Card>
        <CardHeader
          title="Nilai Santri"
          description={`${scoped.length} santri`}
        />
        {!rows ? (
          <LoadingState rows={8} />
        ) : (
          <ScoreTable rows={scoped} onStudentClick={(r) => setEditFor(r)} />
        )}
      </Card>

      <ScoreInput
        open={!!editFor}
        onClose={() => setEditFor(null)}
        student={editFor}
        current={editFor ? editFor.score : null}
        onSave={(score) => saveScore(editFor.student_id, score)}
      />
    </div>
  );
}
