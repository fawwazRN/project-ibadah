const HEART = "M16 28.6S3 20.6 3 11.3C3 7.1 6.1 4 10 4c2.5 0 4.6 1.3 6 3.4C17.4 5.3 19.5 4 22 4c3.9 0 7 3.1 7 7.3 0 9.3-13 17.3-13 17.3z";
const STAR = "M16 2.8l3.9 8 8.8 1.3-6.4 6.2 1.5 8.7L16 22.8l-7.8 4.2 1.5-8.7L3.3 12.1l8.8-1.3z";

export function Heart({ full = true, size = 40, className = "" }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`transition-transform duration-150 hover:scale-110 ${className}`}>
      <path
        d={HEART}
        fill={full ? "#f16b72" : "#fff7f5"}
        stroke={full ? "#d94e5a" : "#e5c9c5"}
        strokeWidth={full ? 0.9 : 1.6}
        strokeLinejoin="round"
      />
      {full && <path d="M10 8.5c1.1-1.2 2.7-1.4 4-.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />}
    </svg>
  );
}

export function HeartRow({ hearts = 5, max = 5, size = 40 }) {
  const count = Math.max(0, Math.min(Number(hearts) || 0, max));
  return (
    <div className="inline-flex items-center gap-1.5" role="img" aria-label={`${count} dari ${max} hati`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart key={i} full={i < count} size={size} className="origin-center" />
      ))}
    </div>
  );
}

export function Star({ size = 32, dim = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="transition-transform duration-150 hover:rotate-6 hover:scale-110"
      style={{ opacity: dim ? 0.35 : 1 }}>
      <path
        d={STAR}
        fill={dim ? "#fffaf0" : "#f5c451"}
        stroke={dim ? "#ded5c4" : "#db9f2b"}
        strokeWidth={dim ? 1.6 : 0.9}
        strokeLinejoin="round"
      />
      {!dim && <path d="M13.3 7.8l1.3 2.7" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".9" />}
    </svg>
  );
}
