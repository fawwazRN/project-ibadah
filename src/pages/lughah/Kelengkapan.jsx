import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input, Select } from "../../components/ui/Field";
import { LoadingState, ErrorState } from "../../components/ui/States";
import ExamSelector from "../../components/lughah/ExamSelector";
import CompletionTable from "../../components/lughah/CompletionTable";
import { useToast } from "../../hooks/useToast";
import { lughahService } from "../../services/lughahService";

const STATUS_FILTERS = [
  { key: "all", label: "Semua" },
  { key: "complete", label: "Lengkap" },
  { key: "incomplete", label: "Belum Lengkap" },
];

export default function LughahKelengkapanPage() {
  const { push } = useToast();
  const [periods, setPeriods] = useState(null);
  const [periodId, setPeriodId] = useState(
    () => localStorage.getItem("lughah.period") ?? "",
  );
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [fClass, setFClass] = useState("");
  const [fStatus, setFStatus] = useState("all");
  const [busyKey, setBusyKey] = useState(null);

  // Muat periode → pilih default (is_current / tersimpan)
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

  // Toggle checkbox — optimistic
  const toggle = async (row, field) => {
    const key = `${row.student_id}|${field}`;
    setBusyKey(key);
    const prev = rows;
    // Optimistic update
    setRows((rs) =>
      rs.map((r) =>
        r.student_id === row.student_id
          ? {
              ...r,
              [field]: !r[field],
              is_complete:
                r.sudah_setor &&
                r.sudah_tanda_tangan &&
                r.sudah_bawa_buku &&
                r.sudah_lengkap_tulisan &&
                field !== "sudah_setor"
                  ? r.is_complete
                  : undefined,
            }
          : r,
      ),
    );
    try {
      await lughahService.toggleField(
        row.student_id,
        periodId,
        field,
        !row[field],
      );
      push("success", "Kelengkapan diperbarui", `${row.full_name} · ${field}`);
      loadRows(); // refresh agar is_complete akurat dari database
    } catch (e) {
      setRows(prev);
      push("error", "Gagal memperbarui", e.message);
    } finally {
      setBusyKey(null);
    }
  };

  // Hooks dulu — filter setelahnya
  const scoped = useMemo(() => {
    let list = rows ?? [];
    if (q)
      list = list.filter((r) =>
        r.full_name.toLowerCase().includes(q.toLowerCase()),
      );
    if (fClass) list = list.filter((r) => r.class_name === fClass);
    if (fStatus === "complete") list = list.filter((r) => r.is_complete);
    if (fStatus === "incomplete") list = list.filter((r) => !r.is_complete);
    return list;
  }, [rows, q, fClass, fStatus]);

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
        title="Kelengkapan Ujian"
        description="Klik kotak untuk mengubah status — tersimpan otomatis. Status Lengkap dihitung otomatis dari 4 syarat."
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
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFStatus(f.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                fStatus === f.key
                  ? "border-brand/40 bg-brand/10 text-brand-soft"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Kelengkapan Santri"
          description={`${scoped.length} santri`}
        />
        {!rows ? (
          <LoadingState rows={8} />
        ) : (
          <CompletionTable rows={scoped} onToggle={toggle} />
        )}
      </Card>
    </div>
  );
}
