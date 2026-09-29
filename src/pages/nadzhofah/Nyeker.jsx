import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input, Select } from "../../components/ui/Field";
import NyekerForm from "../../components/nyeker/NyekerForm";
import NyekerTable from "../../components/nyeker/NyekerTable";
import StudentNyekerHistory from "../../components/nyeker/StudentNyekerHistory";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { nyekerService } from "../../services/nyekerService";

export default function NadzhofahNyekerPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [fClass, setFClass] = useState("");
  const [fDate, setFDate] = useState("");
  const [student, setStudent] = useState(null);

  const load = useCallback(() => {
    setError(null);
    nyekerService
      .list()
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Hapus catatan salah — dengan konfirmasi
  const removeRecord = async (r) => {
    const ok = await confirm({
      title: "Hapus catatan nyeker?",
      message: `Catatan ${r.full_name} (${fmtDateLocal(r.nyeker_date)}${r.note ? ` · ${r.note}` : ""}) akan dihapus permanen. Lakukan hanya bila pencatatan keliru.`,
      confirmText: "Ya, hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await nyekerService.remove(r.id);
      push("success", "Catatan dihapus");
      load();
    } catch (e) {
      push("error", "Gagal menghapus", e.message);
    }
  };

  function fmtDateLocal(d) {
    return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Hooks dulu — filter setelahnya
  const scoped = useMemo(() => {
    let list = rows ?? [];
    if (q)
      list = list.filter((r) =>
        r.full_name.toLowerCase().includes(q.toLowerCase()),
      );
    if (fClass) list = list.filter((r) => r.class_name === fClass);
    if (fDate) list = list.filter((r) => r.nyeker_date === fDate);
    return list;
  }, [rows, q, fClass, fDate]);

  const classes = useMemo(
    () =>
      [
        ...new Set((rows ?? []).map((r) => r.class_name).filter(Boolean)),
      ].sort(),
    [rows],
  );

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <LoadingState rows={8} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Catat Nyeker"
        description="Rekam santri yang ditemukan berjalan tanpa sandal/sepatu. Catatan yang keliru dapat dihapus."
      />

      <div className="gap-5 grid lg:grid-cols-2">
        <NyekerForm onSaved={load} />

        <Card>
          <CardHeader
            title="Catatan Terbaru"
            description={`${scoped.length} catatan sesuai filter`}
          />
          <div className="space-y-2 p-5 pb-0">
            <div className="relative">
              <Search
                size={14}
                className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama…"
                className="pl-9"
              />
            </div>
            <div className="gap-2 grid grid-cols-2">
              <Select
                value={fClass}
                onChange={(e) => setFClass(e.target.value)}
                placeholder="Semua kelas"
                options={classes.map((c) => ({
                  value: c,
                  label: `Kelas ${c}`,
                }))}
              />
              <Input
                type="date"
                className="[color-scheme:dark]"
                value={fDate}
                onChange={(e) => setFDate(e.target.value)}
              />
            </div>
            {fDate && (
              <button
                type="button"
                onClick={() => setFDate("")}
                className="text-slate-500 text-xs underline">
                hapus filter tanggal
              </button>
            )}
          </div>
          <div className="p-5 pt-3">
            <NyekerTable
              rows={scoped.slice(0, 50)}
              onStudentClick={(r) => setStudent(r)}
              onDelete={removeRecord}
            />
          </div>
        </Card>
      </div>

      <StudentNyekerHistory
        open={!!student}
        onClose={() => setStudent(null)}
        student={student}
        records={rows ?? []}
      />
    </div>
  );
}
