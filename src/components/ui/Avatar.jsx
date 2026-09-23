const TINTS = [
  "text-emerald-300 bg-emerald-500/10",
  "text-teal-300 bg-teal-500/10",
  "text-sky-300 bg-sky-500/10",
  "text-violet-300 bg-violet-500/10",
  "text-amber-300 bg-amber-500/10",
];
const SIZES = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
};

export function Avatar({ name = "", size = "md", className = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const tint =
    TINTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % TINTS.length];
  return (
    <span
      className={`grid shrink-0 select-none place-items-center rounded-full border border-white/10 font-display font-semibold ${tint} ${SIZES[size]} ${className}`}>
      {initials || "?"}
    </span>
  );
}
