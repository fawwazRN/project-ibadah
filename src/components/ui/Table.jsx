export const TableWrap = ({ children }) => (
  <div className="overflow-x-auto">{children}</div>
);
export const Table = ({ children }) => (
  <table className="w-full min-w-[640px] text-sm text-left">{children}</table>
);
export const Th = ({ children, className = "" }) => (
  <th
    className={`whitespace-nowrap border-b border-white/[0.07] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
    {children}
  </th>
);
export const Td = ({ children, className = "" }) => (
  <td
    className={`border-b border-white/[0.04] px-4 py-3 align-middle ${className}`}>
    {children}
  </td>
);
export const Tr = ({ children }) => (
  <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>
);
