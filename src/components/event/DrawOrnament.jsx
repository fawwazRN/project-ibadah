import { useReveal } from "../../hooks/useReveal";

// Ornamen geometris islami yang MENGGAMBAR DIRI sendiri saat terlihat.
// Pure stroke animation — tanpa fill, tanpa warna ramai.
export default function DrawOrnament({ className = "" }) {
  const [ref, shown] = useReveal(0.3);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 60"
      fill="none"
      className={className}
      style={{ overflow: "visible" }}>
      {/* Garis kiri */}
      <line
        x1="0"
        y1="30"
        x2="70"
        y2="30"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: shown ? 0 : 70,
          transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)",
        }}
      />
      {/* Garis kanan */}
      <line
        x1="130"
        y1="30"
        x2="200"
        y2="30"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        style={{
          strokeDasharray: 70,
          strokeDashoffset: shown ? 0 : 70,
          transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1) .2s",
        }}
      />
      {/* Belah ketupat tengah — digambar berputar */}
      <rect
        x="92"
        y="22"
        width="16"
        height="16"
        stroke="currentColor"
        strokeWidth="1.2"
        transform="rotate(45 100 30)"
        style={{
          strokeDasharray: 46,
          strokeDashoffset: shown ? 0 : 46,
          transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1) .5s",
        }}
      />
      {/* Titik pusat — fade in */}
      <circle
        cx="100"
        cy="30"
        r="2"
        fill="currentColor"
        style={{
          opacity: shown ? 1 : 0,
          transition: "opacity .6s ease 1.3s",
        }}
      />
    </svg>
  );
}
