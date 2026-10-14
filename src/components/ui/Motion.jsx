import { useEffect, useRef, useState } from "react";
import { useReveal } from "../../hooks/useReveal";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Angka naik halus saat terlihat; berubah nilai → animasi dari nilai lama.
export function CountUp({ value, duration = 1100, suffix = "", className = "" }) {
  const [ref, shown] = useReveal(0.2);
  const num = Number(value);
  const valid =
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && /^-?\d+$/.test(value.trim()));
  const [val, setVal] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!shown || !valid) return undefined;
    if (reduced()) {
      setVal(num);
      return undefined;
    }
    let raf;
    const start = from.current;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(start + (num - start) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = num;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num, shown, valid, duration]);

  return (
    <span ref={ref} className={className}>
      {valid ? `${val}${suffix}` : value}
    </span>
  );
}

// Bar progres: mengisi dari 0 saat terlihat.
export function Bar({ value = 0, max = 100, tone = "var(--color-brand)", height = 8, className = "" }) {
  const [ref, shown] = useReveal(0.2);
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-full bg-soft-2 ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}>
      <div
        className="rounded-full h-full bar-fill"
        style={{ width: shown ? `${pct}%` : "0%", background: tone }}
      />
    </div>
  );
}

// Cincin progres bulat dengan angka di tengah.
export function Ring({ value = 0, size = 84, stroke = 9, tone = "#22b573", label, children }) {
  const [ref, shown] = useReveal(0.2);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={shown ? c * (1 - pct / 100) : c}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {children ?? <span className="font-display font-black text-fg text-lg"><CountUp value={pct} suffix="%" /></span>}
        {label && <span className="-mt-3 font-bold text-[9px] text-fg-3 uppercase">{label}</span>}
      </div>
    </div>
  );
}

// Muncul bertahap (stagger) saat masuk viewport.
export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
  const [ref, shown] = useReveal(0.1);
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

// Ledakan konfeti kecil — panggil lewat ref.current.burst()
export function Confetti({ trigger, colors = ["#ffc21a", "#22b573", "#2f80f0", "#ef4d43", "#9b6cf2"], n = 14 }) {
  const [parts, setParts] = useState([]);
  useEffect(() => {
    if (!trigger || reduced()) return undefined;
    setParts(
      Array.from({ length: n }, (_, i) => ({
        id: `${trigger}-${i}`,
        x: Math.round((Math.random() - 0.5) * 220),
        y: -Math.round(60 + Math.random() * 130),
        r: Math.round(Math.random() * 540 - 270),
        c: colors[i % colors.length],
        d: Math.round(Math.random() * 120),
      })),
    );
    const t = setTimeout(() => setParts([]), 1300);
    return () => clearTimeout(t);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {parts.map((p) => (
        <i
          key={p.id}
          className="confetti-bit"
          style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.r}deg`, background: p.c, animationDelay: `${p.d}ms` }}
        />
      ))}
    </span>
  );
}
