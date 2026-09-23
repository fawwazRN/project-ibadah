import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const WIDTHS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

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

  // Portal ke document.body → modal di luar layout aplikasi,
  // mustahil tertutup header sticky / sidebar / layer mana pun.
  return createPortal(
    <div
      className="print:hidden z-[100] fixed inset-0"
      role="dialog"
      aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      {/* Wrapper: panel selalu di tengah, ada jarak dari tepi viewport */}
      <div className="flex justify-center items-center p-4 min-h-full">
        <div
          className={`flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-850 shadow-card animate-fade-up ${WIDTHS[size]}`}>
          {/* Header — shrink-0: tidak akan pernah terpotong */}
          <div className="flex justify-between items-center gap-3 bg-ink-800 px-5 py-4 border-white/10 border-b shrink-0">
            <h3 className="font-display font-semibold text-[15px] text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="place-items-center grid bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-lg size-8 text-slate-300 hover:text-white transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>
          {/* Body — min-h-0 + flex-1: yang scroll cuma isi, header tetap terlihat */}
          <div className="flex-1 px-5 py-5 min-h-0 overflow-y-auto">
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
