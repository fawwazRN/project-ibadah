import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-brand font-semibold text-ink-950 hover:bg-brand-soft shadow-[0_0_0_1px_rgba(16,185,129,.35)]",
  secondary:
    "border border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.09]",
  ghost: "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
  danger: "bg-rose-500/90 font-semibold text-white hover:bg-rose-500",
  dangerSoft:
    "border border-rose-400/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20",
};
const SIZES = { sm: "h-8 px-3 text-xs gap-1.5", md: "h-10 px-4 text-sm gap-2" };

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon: Icon,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const ic = size === "sm" ? 13 : 15;
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}>
      {loading ? (
        <Loader2 size={ic} className="animate-spin" />
      ) : Icon ? (
        <Icon size={ic} />
      ) : null}
      {children}
    </button>
  );
}
