import { createContext, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const Ctx = createContext(null);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = (opts) =>
    new Promise((res) => {
      resolver.current = res;
      setState(opts);
    });
  const close = (v) => {
    setState(null);
    resolver.current?.(v);
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        size="sm"
        title={state?.title}>
        <div className="flex gap-3">
          {state?.tone === "danger" && (
            <span className="place-items-center grid bg-rose-100 rounded-xl size-10 text-rose-700 shrink-0">
              <AlertTriangle size={19} />
            </span>
          )}
          <p className="pt-1 text-fg-2 text-sm leading-relaxed">
            {state?.message}
          </p>
        </div>
        <div className="flex sm:flex-row flex-col-reverse sm:justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={() => close(false)}>
            Batal
          </Button>
          <Button
            variant={state?.tone === "danger" ? "danger" : "primary"}
            onClick={() => close(true)}>
            {state?.confirmText ?? "Ya, lanjutkan"}
          </Button>
        </div>
      </Modal>
    </Ctx.Provider>
  );
}
