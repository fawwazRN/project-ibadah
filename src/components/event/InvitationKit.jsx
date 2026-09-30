import { useEffect, useState } from "react";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { useReveal } from "../../hooks/useReveal";

/* ===== RevealSection: fade+slide saat masuk viewport (basis semua section) ===== */
export function RevealSection({ children, delay = 0, className = "", y = 40 }) {
  const [ref, shown] = useReveal(0.1);
  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: `opacity 1s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 1s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}>
      {children}
    </section>
  );
}

/* ===== TextReveal: KATA MUNCUL BERURUTAN (stagger waktu) —
   Begitu section masuk, semua kata tampil penuh dalam ~1.2s dan TETAP TERBACA ===== */
export function TextReveal({ text, className = "", stagger = 70 }) {
  const [ref, shown] = useReveal(0.2);
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: shown ? 1 : 0,
            transform: shown ? "none" : "translateY(14px)",
            filter: shown ? "blur(0)" : "blur(4px)",
            transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${i * stagger}ms, transform .7s cubic-bezier(.22,1,.36,1) ${i * stagger}ms, filter .7s ease ${i * stagger}ms`,
            marginRight: "0.35em",
          }}>
          {w}
        </span>
      ))}
    </p>
  );
}

/* ===== CinematicZoom: kartu ZOOM-IN besar dari 0.55 → 1 saat scroll ===== */
export function CinematicZoom({ children, className = "" }) {
  const [ref, p] = useScrollProgress();
  const scale = Math.min(1, 0.55 + Math.max(0, p - 0.1) * 1.4);
  const opacity = Math.min(1, Math.max(0, (p - 0.12) * 2.4));
  const rotate = (1 - Math.min(1, Math.max(0, (p - 0.1) * 1.6))) * 3; // mulai miring 3°, lurus saat masuk
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        opacity,
        transformOrigin: "center center",
      }}>
      {children}
    </div>
  );
}

/* ===== SlideCard: geser BESAR dari kiri/kanan + rotate ringan ===== */
export function SlideCard({ children, direction = "left", className = "" }) {
  const [ref, p] = useScrollProgress();
  const from = direction === "left" ? -260 : 260;
  const t = Math.min(1, p * 1.7);
  const x = (1 - t) * from;
  const rotate = (1 - t) * (direction === "left" ? -4 : 4);
  const opacity = Math.min(1, p * 2);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateX(${x}px) rotate(${rotate}deg)`,
        opacity,
      }}>
      {children}
    </div>
  );
}

/* ===== ParallaxLayer: parallax multi-layer nyata ===== */
export function ParallaxLayer({ children, speed = 0.4, className = "" }) {
  const [ref, p] = useScrollProgress();
  const y = (p - 0.5) * 200 * speed;
  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translateY(${y}px)` }}>
      {children}
    </div>
  );
}

/* ===== ScaleLine: garis memanjang dari tengah ===== */
export function ScaleLine({ className = "" }) {
  const [ref, p] = useScrollProgress();
  const width = Math.min(100, Math.max(0, (p - 0.15) * 220));
  return (
    <div ref={ref} className={`flex justify-center ${className}`}>
      <div
        className="bg-gradient-to-r from-transparent via-brand/50 to-transparent h-px"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ===== FloatRing: cincin dekor mengambang dengan gerakan halus ===== */
export function FloatRing({
  size = 500,
  duration = 40,
  reverse = false,
  className = "",
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full border border-brand/[0.08] ${className}`}
      style={{
        width: size,
        height: size,
        animation: `FloatY ${duration}s ease-in-out infinite ${reverse ? "reverse" : ""}, Spin ${duration * 2}s linear infinite ${reverse ? "reverse" : ""}`,
      }}
    />
  );
}

/* ===== FloatingBadge: elemen kecil mengambang naik-turun ===== */
export function FloatingBadge({ children, delay = 0, className = "" }) {
  return (
    <div
      className={className}
      style={{
        animation: `FloatY 6s ease-in-out infinite ${delay}s`,
      }}>
      {children}
    </div>
  );
}
