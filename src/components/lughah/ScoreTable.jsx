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
              <Td className="font-mono text-fg-3 text-xs">{i + 1}</Td>
              <Td>
                <button
                  type="button"
                  onClick={() => onStudentClick?.(r)}
                  className="font-medium text-fg hover:text-brand-dim hover:underline truncate transition-colors">
                  {r.full_name}
                </button>
              </Td>
              <Td className="text-fg-2">{r.class_name}</Td>
              <Td>
                {r.score != null ? (
                  <span
                    className={`font-mono font-bold ${r.score >= 75 ? "text-emerald-700" : r.score >= 60 ? "text-amber-700" : "text-rose-700"}`}>
                    {r.score}
                  </span>
                ) : (
                  <span className="text-fg-3">—</span>
                )}
              </Td>
              <Td>
                {r.score != null ? (
                  <Badge tone="emerald">Sudah dinilai</Badge>
                ) : (
                  <Badge tone="neutral">Belum dinilai</Badge>
                )}
              </Td>
              <Td className="text-fg-3 text-xs whitespace-nowrap">
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
