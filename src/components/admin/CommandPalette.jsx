import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { normText } from "../../lib/calc";

// Palet perintah (Ctrl/⌘ + K): lompat ke halaman mana pun dengan keyboard.
export default function CommandPalette({ open, onClose, items }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const list = useMemo(() => {
    const n = normText(q);
    return items.filter(
      (it) => !n || normText(`${it.label} ${it.section}`).includes(n),
    );
  }, [items, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);
  useEffect(() => setIdx(0), [q]);
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-on="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  if (!open) return null;

  const go = (it) => {
    onClose();
    navigate(it.to);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && list[idx]) {
      e.preventDefault();
      go(list[idx]);
    } else if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="z-[110] fixed inset-0 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Cari halaman">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative mx-auto mt-[12vh] px-3 max-w-xl">
        <div className="bg-card shadow-2xl border border-line rounded-xl overflow-hidden animate-pop">
          <div className="flex items-center gap-2.5 px-4 border-line border-b">
            <Search size={16} className="text-fg-3" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onKey}
              placeholder="Cari halaman atau aksi…"
              className="flex-1 bg-transparent py-3.5 outline-none text-fg placeholder:text-fg-4 text-sm"
            />
            <kbd className="px-1.5 py-0.5 border border-line rounded font-bold text-[10px] text-fg-3">
              Esc
            </kbd>
          </div>
          <ul ref={listRef} className="p-1.5 max-h-[50vh] overflow-y-auto">
            {list.length === 0 && (
              <li className="px-3 py-8 text-fg-3 text-sm text-center">
                Tidak ada hasil untuk “{q}”.
              </li>
            )}
            {list.map((it, i) => (
              <li key={it.to + it.label}>
                <button
                  data-on={i === idx}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => go(it)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                    i === idx ? "bg-tint text-brand-dim" : "text-fg-2"
                  }`}>
                  {it.icon && <it.icon size={16} className="shrink-0" />}
                  <span className="flex-1 font-semibold truncate">
                    {it.label}
                  </span>
                  <span className="text-[11px] text-fg-3">{it.section}</span>
                  {i === idx && <CornerDownLeft size={13} />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
