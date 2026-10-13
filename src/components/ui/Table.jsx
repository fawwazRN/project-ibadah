export const TableWrap = ({ children }) => (
  <div className="overflow-x-auto">{children}</div>
);
export const Table = ({ children }) => (
  <table className="w-full min-w-[640px] text-sm text-left">{children}</table>
);
export const Th = ({ children, className = "" }) => (
  <th
    className={`whitespace-nowrap border-b border-line bg-soft/70 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-fg-3 ${className}`}>
    {children}
  </th>
);
export const Td = ({ children, className = "" }) => (
  <td className={`border-b border-line/70 px-4 py-3 align-middle ${className}`}>
    {children}
  </td>
);
export const Tr = ({ children }) => (
  <tr className="hover:bg-soft transition-colors">{children}</tr>
);
