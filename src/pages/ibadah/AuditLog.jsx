import { useCallback, useEffect, useState } from "react";
import { Search, History } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ACTION_META } from "../../components/dashboard/actionMeta";
import { auditService } from "../../services/auditService";
import { fmtDateTime } from "../../lib/date";

export default function AuditLog() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(() => {
    setError(null);
    auditService
      .list()
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!logs) return <LoadingState rows={8} />;

  const list = logs.filter(
    (l) =>
      (!action || l.action === action) &&
      (!q ||
        (l.target_label ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (l.actor?.full_name ?? "").toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Log Audit"
        description="Jejak seluruh tindakan penting OSIS — siapa, apa, dan kapan. Hanya dapat diakses OSIS Qism Ibadah."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative w-64">
          <Search
            size={14}
            className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari target atau pengguna…"
            className="pl-8"
          />
        </div>
        <Select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Semua jenis aksi"
          className="w-56"
          options={Object.entries(ACTION_META).map(([k, m]) => ({
            value: k,
            label: m.label,
          }))}
        />
        <Button variant="ghost" onClick={load}>
          Muat ulang
        </Button>
      </div>

      <Card>
        {list.length === 0 ? (
          <EmptyState
            icon={History}
            title="Tidak ada catatan audit"
            description="Belum ada aktivitas yang cocok dengan filter."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Pengguna</Th>
                  <Th>Aksi</Th>
                  <Th>Target</Th>
                </tr>
              </thead>
              <tbody>
                {list.map((l) => {
                  const m = ACTION_META[l.action] ?? {
                    icon: History,
                    label: l.action,
                    tone: "neutral",
                  };
                  const Icon = m.icon;
                  return (
                    <Tr key={l.id}>
                      <Td className="text-slate-400 whitespace-nowrap">
                        {fmtDateTime(l.created_at)}
                      </Td>
                      <Td className="text-slate-200">
                        {l.actor?.full_name ?? "—"}
                      </Td>
                      <Td>
                        <Badge tone={m.tone}>
                          <Icon size={11} /> {m.label}
                        </Badge>
                      </Td>
                      <Td className="text-slate-400">
                        {l.target_label ?? "—"}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
