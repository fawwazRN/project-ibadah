import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const WIDTHS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

// Mobile → bottom sheet (geser dari bawah, seperti aplikasi native).
// Desktop → dialog di tengah.
export function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="print:hidden z-[100] fixed inset-0"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}>
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative flex justify-center items-end sm:items-center sm:p-4 min-h-full pointer-events-none">
        <div
          style={{ borderWidth: "var(--bw)" }}
          className={`pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border-line bg-card shadow-2xl animate-sheet-up sm:max-h-[calc(100dvh-2rem)] sm:animate-pop sm:rounded-[var(--r-card)] ${WIDTHS[size] ?? WIDTHS.md}`}>
          <div className="sm:hidden flex justify-center pt-2.5 shrink-0">
            <span className="bg-line-2 rounded-full w-10 h-1.5" />
          </div>
          <div className="flex justify-between items-center gap-3 px-5 sm:py-4 pt-2 pb-3 border-line border-b shrink-0">
            <h3
              className="font-display text-fg text-base"
              style={{ fontWeight: "var(--head-weight)" }}>
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="place-items-center grid bg-soft-2 hover:bg-line rounded-full size-9 text-fg-2 transition-colors shrink-0">
              <X size={17} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex-1 px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] min-h-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Kompatibilitas: boleh diimpor `import { Modal }` ATAU `import Modal`
export default Modal;
