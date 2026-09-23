import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col justify-center items-center gap-2 px-6 py-14 text-center">
      {Icon && (
        <span className="place-items-center grid bg-white/[0.03] border border-white/[0.07] rounded-xl size-11 text-slate-500">
          <Icon size={19} />
        </span>
      )}
      <p className="mt-1 font-display font-semibold text-slate-200 text-sm">
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-slate-500 text-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 3 }) {
  return (
    <div className="space-y-2.5 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="bg-white/[0.04] rounded-xl h-12 animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
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
      <span className="place-items-center grid bg-rose-500/10 rounded-xl size-11 text-rose-300">
        <AlertTriangle size={19} />
      </span>
      <p className="text-slate-300 text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}
