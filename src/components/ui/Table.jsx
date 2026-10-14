import { useEffect, useRef } from "react";

// Di layar kecil, tabel berubah jadi kartu per baris. Label kolom diambil
// otomatis dari <thead> (tanpa perlu mengubah halaman pemakai).
export const TableWrap = ({ children }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let busy = false;
    const label = () => {
      if (busy) return;
      busy = true;
      const heads = [...el.querySelectorAll("thead th")].map((t) => t.textContent.trim());
      el.querySelectorAll("tbody tr").forEach((tr) => {
        [...tr.children].forEach((td, i) => {
          const v = td.hasAttribute("colspan") ? "" : heads[i] ?? "";
          if (td.getAttribute("data-label") !== v) td.setAttribute("data-label", v);
        });
      });
      busy = false;
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return (
    <div ref={ref} className="overflow-x-auto rtable-wrap">
      {children}
    </div>
  );
};
export const Table = ({ children }) => (
  <table className="w-full min-w-[640px] text-sm text-left rtable">{children}</table>
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
