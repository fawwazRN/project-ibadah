import { useCallback, useEffect, useState } from "react";
import { Flag, Plus } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Field";
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
import { fmtDateTime } from "../../lib/date";

export default function ViolationsManagement() {
  const [violations, setViolations] = useState(null);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState(null);
  const [fStatus, setFStatus] = useState("");
  const [fClass, setFClass] = useState("");
  const [fRule, setFRule] = useState("");
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

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!violations) return <LoadingState rows={8} />;

  const classes = [
    ...new Set(violations.map((v) => v.santri?.class_name).filter(Boolean)),
  ].sort();
  const list = violations.filter(
    (v) =>
      (!fStatus || v.status === fStatus) &&
      (!fClass || v.santri?.class_name === fClass) &&
      (!fRule || v.rule_id === fRule),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Manajemen Pelanggaran"
        description="Catat, tinjau, dan kelola seluruh pelanggaran santri."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setFormOpen(true)}>
            Catat Pelanggaran
          </Button>
        }
      />

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
                {list.slice(0, 100).map((v) => (
                  <Tr key={v.id}>
                    <Td className="text-slate-400 whitespace-nowrap">
                      {fmtDateTime(v.occurred_at)}
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
      </Card>

      <ViolationFormModal
        open={formOpen}
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
