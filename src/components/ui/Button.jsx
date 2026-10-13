import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  dangerSoft: "btn-danger-soft",
};
const SIZES = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" };

export function Button({
  variant = "secondary",
  size = "md",
  loading,
  icon: Icon,
  className = "",
  children,
  disabled,
  onClick,
  ...rest
}) {
  const ic = size === "sm" ? 14 : size === "lg" ? 18 : 16;
  const handleClick = (e) => {
    // Getaran halus (Android) — hanya di tampilan santri/tamu
    if (
      variant === "primary" &&
      document.documentElement.dataset.skin === "play"
    )
      navigator.vibrate?.(8);
    onClick?.(e);
  };
  return (
    <button
      disabled={disabled || loading}
      onClick={handleClick}
      className={`btn ${VARIANTS[variant] ?? VARIANTS.secondary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}>
      {loading ? (
        <Loader2 size={ic} className="animate-spin" />
      ) : Icon ? (
        <Icon size={ic} strokeWidth={2.4} />
      ) : null}
      {children}
    </button>
  );
}
