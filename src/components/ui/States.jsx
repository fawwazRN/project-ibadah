import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Mascot } from "./Mascot";

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col justify-center items-center gap-1.5 px-6 py-12 text-center">
      {/* play → maskot ngantuk · work → ikon */}
      <span className="only-play animate-float">
        <Mascot mood="sleepy" size={92} />
      </span>
      {Icon && (
        <span className="only-work place-items-center grid bg-soft-2 rounded-xl size-11 text-fg-3">
          <Icon size={19} />
        </span>
      )}
      <p
        className="mt-1 font-display text-fg text-base"
        style={{ fontWeight: "var(--head-weight)" }}>
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-fg-3 text-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 3 }) {
  return (
    <div className="space-y-3 p-1" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-14"
          style={{ animationDelay: `${i * 120}ms`, opacity: 1 - i * 0.08 }}
        />
      ))}
    </div>
  );
}

export function ErrorState({
  message = "Terjadi kesalahan saat memuat data.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="only-play">
        <Mascot mood="worried" size={92} />
      </span>
      <span className="only-work place-items-center grid bg-rose-100 rounded-xl size-11 text-rose-700">
        <AlertTriangle size={19} />
      </span>
      <p className="max-w-sm font-semibold text-fg-2 text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
