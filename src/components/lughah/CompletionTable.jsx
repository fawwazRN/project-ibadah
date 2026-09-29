import { Check, X } from "lucide-react";
import { TableWrap, Table, Th, Td, Tr } from "../ui/Table";
import { EmptyState } from "../ui/States";
import CompletionStatus from "./CompletionStatus";

const FIELDS = [
  { key: "sudah_setor", label: "Setor" },
  { key: "sudah_tanda_tangan", label: "TTD" },
  { key: "sudah_bawa_buku", label: "Buku" },
  { key: "sudah_lengkap_tulisan", label: "Tulisan" },
];

// Checkbox inline — perubahan langsung di-commit via onToggle (optimistic)
export function CompletionTable({ rows, onToggle }) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title="Tidak ada santri"
        description="Sesuaikan filter atau pencarian."
      />
    );
  }
  const CheckCell = ({ row, field }) => (
    <Td className="text-center">
      <button
        type="button"
        onClick={() => onToggle?.(row, field)}
        className={`mx-auto grid size-6 place-items-center rounded-md border transition-colors ${
          row[field]
            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
            : "border-white/15 bg-white/[0.03] text-slate-600 hover:border-white/30"
        }`}
        title={row[field] ? `Batalkan ${field}` : `Tandai ${field}`}>
        {row[field] ? <Check size={13} /> : <X size={13} />}
      </button>
    </Td>
  );

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>No</Th>
            <Th>Santri</Th>
            <Th>Kelas</Th>
            {FIELDS.map((f) => (
              <Th key={f.key} className="text-center">
                {f.label}
              </Th>
            ))}
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.student_id}>
              <Td className="font-mono text-slate-500 text-xs">{i + 1}</Td>
              <Td className="font-medium text-slate-200">{r.full_name}</Td>
              <Td className="text-slate-300">{r.class_name}</Td>
              {FIELDS.map((f) => (
                <CheckCell key={f.key} row={r} field={f.key} />
              ))}
              <Td>
                <CompletionStatus complete={r.is_complete} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}

export default CompletionTable;
