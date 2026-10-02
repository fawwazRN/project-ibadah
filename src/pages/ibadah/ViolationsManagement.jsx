import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, Plus, Search, X } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select, Input } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { ViolationFormModal } from "../../components/violations/ViolationFormModal";
import { ViolationDetailModal } from "../../components/violations/ViolationDetailModal";
import { violationService } from "../../services/violationService";
import { ruleService } from "../../services/ruleService";
import { fmtOccurred } from "../../lib/date";
import { fmtNum, matchesSearch } from "../../lib/calc";

const STEP = 100;

export default function ViolationsManagement() {
  const [violations, setViolations] = useState(null);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [fStatus, setFStatus] = useState("");
  const [fClass, setFClass] = useState("");
  const [fRule, setFRule] = useState("");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(STEP);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([violationService.list(), ruleService.list()])
      .then(([v, r]) => {
        setViolations(v);
        setRules(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Hook harus dipanggil sebelum return dini
  const list = useMemo(
    () =>
      (violations ?? []).filter(
        (v) =>
          (!fStatus || v.status === fStatus) &&
          (!fClass || v.santri?.class_name === fClass) &&
          (!fRule || v.rule_id === fRule) &&
          matchesSearch(v, q),
      ),
    [violations, fStatus, fClass, fRule, q],
  );

  // Kembali ke 100 baris pertama tiap filter/pencarian berubah
  useEffect(() => setVisible(STEP), [fStatus, fClass, fRule, q]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!violations) return <LoadingState rows={8} />;

  const classes = [
    ...new Set(violations.map((v) => v.santri?.class_name).filter(Boolean)),
  ].sort();

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Manajemen Pelanggaran"
        description="Catat, tinjau, dan kelola pelanggaran ranah Qism Ibadah."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setFormOpen(true)}>
            Catat Pelanggaran
          </Button>
        }
      />

      <div className="relative mb-3">
        <Search
          size={15}
          className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2 pointer-events-none"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama santri, kelas, aturan, atau catatan…"
          className="pr-9 pl-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Hapus pencarian"
            className="top-1/2 right-2.5 absolute place-items-center grid size-6 text-slate-500 hover:text-slate-200 -translate-y-1/2">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="gap-3 grid sm:grid-cols-3 mb-4">
        <Select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          placeholder="Semua status"
          options={[
            ["active", "Aktif"],
            ["reported", "Dilaporkan"],
            ["under_review", "Ditinjau"],
            ["confirmed", "Terbukti"],
            ["revoked", "Dibatalkan"],
          ].map(([v, l]) => ({ value: v, label: l }))}
        />
        <Select
          value={fClass}
          onChange={(e) => setFClass(e.target.value)}
          placeholder="Semua kelas"
          options={classes.map((c) => ({ value: c, label: `Kelas ${c}` }))}
        />
        <Select
          value={fRule}
          onChange={(e) => setFRule(e.target.value)}
          placeholder="Semua aturan"
          options={rules.map((r) => ({ value: r.id, label: r.name }))}
        />
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Tidak ada pelanggaran"
            description="Belum ada data pada filter ini."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Santri</Th>
                  <Th>Aturan</Th>
                  <Th>Poin</Th>
                  <Th>Status</Th>
                  <Th>Catatan</Th>
                  <Th className="text-right">Aksi</Th>
                </tr>
              </thead>
              <tbody>
                {list.slice(0, visible).map((v) => (
                  <Tr key={v.id}>
                    <Td className="text-slate-400 whitespace-nowrap">
                      {fmtOccurred(v)}
                    </Td>
                    <Td>
                      <p className="font-medium text-slate-200">
                        {v.santri?.full_name}
                      </p>
                      <p className="text-slate-500 text-xs">
                        Kelas {v.santri?.class_name}
                      </p>
                    </Td>
                    <Td className="text-slate-300">{v.rule?.name}</Td>
                    <Td>
                      <Badge tone="rose">+{v.rule?.points}</Badge>
                    </Td>
                    <Td>
                      <ViolationStatusBadge status={v.status} />
                    </Td>
                    <Td className="max-w-[180px] text-slate-500 text-xs truncate">
                      {v.note || "—"}
                    </Td>
                    <Td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetail(v)}>
                        Kelola
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
        {list.length > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-white/[0.06] border-t text-slate-500 text-xs">
            <span>
              Menampilkan {fmtNum(Math.min(visible, list.length))} dari{" "}
              {fmtNum(list.length)} catatan
              {list.length !== violations.length &&
                ` (total ${fmtNum(violations.length)})`}
            </span>
            {visible < list.length && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setVisible((n) => n + STEP)}>
                  Tampilkan {Math.min(STEP, list.length - visible)} lagi
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setVisible(list.length)}>
                  Tampilkan semua
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <ViolationFormModal
        open={formOpen}
        scope="ibadah"
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
      <ViolationDetailModal
        violation={detail}
        open={!!detail}
        canManage
        onClose={() => setDetail(null)}
        onChanged={load}
      />
    </div>
  );
}
