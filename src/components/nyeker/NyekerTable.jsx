import { Footprints, Trash2, CircleCheck, CircleDashed } from "lucide-react";
import { TableWrap, Table, Th, Td, Tr } from "../ui/Table";
import { EmptyState } from "../ui/States";
import { Badge } from "../ui/Badge";
import { fmtNum } from "../../lib/calc";
import { fmtDate } from "../../lib/date";

const rp = (n) => `Rp ${fmtNum(n)}`;

export function NyekerTable({ rows, onStudentClick, onDelete, onTogglePaid }) {
  const showActions = !!(onDelete || onTogglePaid);
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
            <Th>Denda</Th>
            <Th>Dicatat oleh</Th>
            {showActions && <Th className="text-right">Aksi</Th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <Tr key={r.id}>
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
              <Td className="text-fg-2 whitespace-nowrap">
                {fmtDate(r.nyeker_date)}
              </Td>
              <Td className="text-fg-2 whitespace-nowrap">
                {String(r.nyeker_time).slice(0, 5)}
              </Td>
              <Td className="max-w-[180px] text-fg-3 text-xs truncate">
                {r.note || "—"}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-mono text-xs font-semibold ${r.fine_paid ? "text-emerald-700" : "text-rose-700"}`}>
                    {rp(r.fine_amount ?? 5000)}
                  </span>
                  {onTogglePaid ? (
                    <button
                      type="button"
                      onClick={() => onTogglePaid(r)}
                      title={r.fine_paid ? "Klik untuk tandai belum lunas" : "Klik untuk tandai lunas"}
                      className="rounded-md focus:outline-none focus:ring-2 focus:ring-brand/60"
                    >
                      {r.fine_paid ? (
                        <Badge tone="emerald">Lunas · klik ubah</Badge>
                      ) : (
                        <Badge tone="amber">Belum · klik lunas</Badge>
                      )}
                    </button>
                  ) : r.fine_paid ? (
                    <Badge tone="emerald">Lunas</Badge>
                  ) : (
                    <Badge tone="amber">Belum</Badge>
                  )}
                </div>
              </Td>
              <Td className="max-w-[140px] text-fg-3 text-xs truncate">
                {r.recorder_name || "—"}
              </Td>
              {showActions && (
                <Td className="text-right">
                  <div className="flex justify-end gap-1.5">
                    {onTogglePaid && (
                      <button
                        type="button"
                        onClick={() => onTogglePaid(r)}
                        title={
                          r.fine_paid ? "Tandai belum lunas" : "Tandai LUNAS"
                        }
                        className={`grid size-7 place-items-center rounded-md transition-colors ${
                          r.fine_paid
                            ? "text-emerald-700 hover:bg-emerald-500/10"
                            : "text-fg-3 hover:bg-emerald-500/10 hover:text-emerald-700"
                        }`}>
                        {r.fine_paid ? (
                          <CircleCheck size={15} />
                        ) : (
                          <CircleDashed size={15} />
                        )}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        title="Hapus catatan"
                        className="place-items-center grid hover:bg-rose-500/10 rounded-md size-7 text-fg-3 hover:text-rose-700 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
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
