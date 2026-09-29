import { TableWrap, Table, Th, Td, Tr } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/States";
import { fmtDate } from "../../lib/date";

export function ScoreTable({ rows, onStudentClick }) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="Tidak ada santri"
        description="Sesuaikan filter atau pencarian."
      />
    );
  }
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>No</Th>
            <Th>Santri</Th>
            <Th>Kelas</Th>
            <Th>Nilai</Th>
            <Th>Status</Th>
            <Th>Diperbarui</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.student_id}>
              <Td className="font-mono text-slate-500 text-xs">{i + 1}</Td>
              <Td>
                <button
                  type="button"
                  onClick={() => onStudentClick?.(r)}
                  className="font-medium text-slate-200 hover:text-brand-soft hover:underline truncate transition-colors">
                  {r.full_name}
                </button>
              </Td>
              <Td className="text-slate-300">{r.class_name}</Td>
              <Td>
                {r.score != null ? (
                  <span
                    className={`font-mono font-bold ${r.score >= 75 ? "text-emerald-300" : r.score >= 60 ? "text-amber-300" : "text-rose-300"}`}>
                    {r.score}
                  </span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </Td>
              <Td>
                {r.score != null ? (
                  <Badge tone="emerald">Sudah dinilai</Badge>
                ) : (
                  <Badge tone="neutral">Belum dinilai</Badge>
                )}
              </Td>
              <Td className="text-slate-500 text-xs whitespace-nowrap">
                {r.updated_at ? fmtDate(r.updated_at) : "—"}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}

export default ScoreTable;
