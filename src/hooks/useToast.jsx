import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

const TONES = {
  success: { icon: CheckCircle2, chip: "bg-emerald-100 text-emerald-700", color: "#22b573" },
  error: { icon: AlertTriangle, chip: "bg-rose-100 text-rose-700", color: "#ef4d43" },
  info: { icon: Info, chip: "bg-sky-100 text-sky-700", color: "#2f80f0" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((tone, title, description = "") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, tone, title, description }]);
    if (tone === "error") navigator.vibrate?.([30, 40, 30]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      {/* Mobile: melayang di atas tab bar · Desktop: kanan-bawah */}
      <div
        aria-live="polite"
        className="print:hidden inset-x-3 lg:inset-x-auto lg:right-5 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] lg:bottom-5 z-[120] fixed flex flex-col gap-2 lg:w-[360px] pointer-events-none">
        {toasts.map((t) => {
          const { icon: Icon, chip, color } = TONES[t.tone] || TONES.info;
          return (
            <div
              key={t.id}
              style={{ borderWidth: "var(--bw)", "--toast-tone": color }}
              className="flex items-start gap-3 bg-card/95 shadow-xl px-3.5 py-3 border-line rounded-2xl toast-elegant pointer-events-auto">
              <span
                className={`toast-ico grid size-8 shrink-0 place-items-center rounded-xl ${chip}`}>
                <Icon size={17} strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-extrabold text-fg text-sm">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-fg-3 text-xs leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Tutup"
                className="text-fg-4 hover:text-fg-2 transition-colors">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
