import { Footprints, Trash2 } from "lucide-react";
import { TableWrap, Table, Th, Td, Tr } from "../ui/Table";
import { EmptyState } from "../ui/States";
import { fmtDate } from "../../lib/date";

export function NyekerTable({ rows, onStudentClick, onDelete }) {
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={Footprints}
        title="Belum ada catatan"
        description="Belum ada data nyeker pada filter ini."
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
            <Th>Tanggal</Th>
            <Th>Waktu</Th>
            <Th>Catatan</Th>
            <Th>Dicatat oleh</Th>
            {onDelete && <Th className="text-right">Aksi</Th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.id}>
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
              <Td className="text-slate-400 whitespace-nowrap">
                {fmtDate(r.nyeker_date)}
              </Td>
              <Td className="text-slate-400 whitespace-nowrap">
                {String(r.nyeker_time).slice(0, 5)}
              </Td>
              <Td className="max-w-[180px] text-slate-500 text-xs truncate">
                {r.note || "—"}
              </Td>
              <Td className="max-w-[140px] text-slate-500 text-xs truncate">
                {r.recorder_name || "—"}
              </Td>
              {onDelete && (
                <Td className="text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    title="Hapus catatan"
                    className="place-items-center grid hover:bg-rose-500/10 rounded-md size-7 text-slate-500 hover:text-rose-300 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </Td>
              )}
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}

export default NyekerTable;
