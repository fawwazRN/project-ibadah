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
  success: { icon: CheckCircle2, cls: "border-brand/30 text-brand-soft" },
  error: { icon: AlertTriangle, cls: "border-rose-400/30 text-rose-300" },
  info: { icon: Info, cls: "border-sky-400/30 text-sky-300" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((tone, title, description = "") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, tone, title, description }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="print:hidden right-4 bottom-4 z-[120] fixed flex flex-col gap-2 w-[min(92vw,360px)]">
        {toasts.map((t) => {
          const { icon: Icon, cls } = TONES[t.tone] || TONES.info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border bg-ink-800 px-4 py-3 shadow-card ${cls}`}>
              <Icon size={17} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 text-sm">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-0.5 text-slate-400 text-xs leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
