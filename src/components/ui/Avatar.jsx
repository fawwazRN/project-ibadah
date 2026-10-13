const TINTS = [
  "text-emerald-700 bg-emerald-100",
  "text-teal-700 bg-teal-100",
  "text-sky-700 bg-sky-100",
  "text-violet-700 bg-violet-100",
  "text-amber-700 bg-amber-100",
  "text-pink-700 bg-pink-100",
  "text-orange-700 bg-orange-100",
  "text-cyan-700 bg-cyan-100",
  "text-indigo-700 bg-indigo-100",
];
const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-2xl",
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
      className={`grid shrink-0 select-none place-items-center rounded-full font-display ${tint} ${SIZES[size] ?? SIZES.md} ${className}`}
      style={{ fontWeight: "var(--head-weight)" }}>
      {initials || "?"}
    </span>
  );
}
