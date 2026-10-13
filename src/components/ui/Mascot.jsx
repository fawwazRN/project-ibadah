// Maskot OSIS — "Si Peci": makhluk bulat hijau bersongkok.
// Dipakai untuk sapaan, empty state, dan error (skin "play").
const MOODS = {
  happy: "happy",
  cheer: "cheer",
  worried: "worried",
  sleepy: "sleepy",
};

export function Mascot({
  mood = "happy",
  size = 96,
  wave = false,
  className = "",
}) {
  const m = MOODS[mood] ?? "happy";
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label="Maskot OSIS"
      className={className}>
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#000" opacity=".08" />

      {/* kaki */}
      <ellipse cx="46" cy="106" rx="10" ry="5.5" fill="#ff9a1f" />
      <ellipse cx="74" cy="106" rx="10" ry="5.5" fill="#ff9a1f" />

      {/* sayap */}
      <ellipse
        cx="20"
        cy="76"
        rx="8"
        ry="13"
        fill="#168a57"
        transform="rotate(18 20 76)"
      />
      <g
        style={
          wave
            ? {
                transformOrigin: "100px 66px",
                animation: "wave 1.6s ease-in-out infinite",
              }
            : undefined
        }>
        <ellipse
          cx="100"
          cy="76"
          rx="8"
          ry="13"
          fill="#168a57"
          transform="rotate(-18 100 76)"
        />
      </g>

      {/* badan (dengan sisi 3D) */}
      <ellipse cx="60" cy="73" rx="41" ry="37" fill="#168a57" />
      <ellipse cx="60" cy="68" rx="41" ry="37" fill="#22b573" />
      <ellipse cx="60" cy="82" rx="26" ry="20" fill="#b6f0d1" />

      {/* songkok */}
      <path
        d="M29 42 C29 21 42 15 60 15 C78 15 91 21 91 42 L91 46 C75 52 45 52 29 46 Z"
        fill="#2b2d33"
      />
      <path
        d="M29 42 C45 48 75 48 91 42 L91 47 C75 53 45 53 29 47 Z"
        fill="#ffc21a"
      />
      <circle cx="60" cy="28" r="3.2" fill="#ffc21a" />

      {/* pipi */}
      <circle cx="33" cy="77" r="5" fill="#ff8a8a" opacity=".5" />
      <circle cx="87" cy="77" r="5" fill="#ff8a8a" opacity=".5" />

      {/* mata */}
      {m === "sleepy" ? (
        <g
          stroke="#2b2d33"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none">
          <path d="M37 64 Q46 70 55 64" />
          <path d="M65 64 Q74 70 83 64" />
        </g>
      ) : m === "cheer" ? (
        <g
          stroke="#2b2d33"
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none">
          <path d="M37 63 Q46 54 55 63" />
          <path d="M65 63 Q74 54 83 63" />
        </g>
      ) : (
        <g>
          <circle cx="46" cy="63" r="10" fill="#fff" />
          <circle cx="74" cy="63" r="10" fill="#fff" />
          <circle
            cx={m === "worried" ? 46 : 47}
            cy={m === "worried" ? 61 : 64}
            r="5.2"
            fill="#2b2d33"
          />
          <circle
            cx={m === "worried" ? 74 : 73}
            cy={m === "worried" ? 61 : 64}
            r="5.2"
            fill="#2b2d33"
          />
          <circle cx="48.6" cy="61.4" r="1.8" fill="#fff" />
          <circle cx="75.6" cy="61.4" r="1.8" fill="#fff" />
        </g>
      )}

      {/* alis cemas */}
      {m === "worried" && (
        <g stroke="#2b2d33" strokeWidth="3" strokeLinecap="round">
          <path d="M37 50 L54 55" />
          <path d="M83 50 L66 55" />
        </g>
      )}

      {/* mulut */}
      {m === "cheer" ? (
        <g>
          <path d="M50 74 Q60 96 70 74 Z" fill="#7a2a2a" />
          <path d="M55 85 Q60 90 65 85 Q60 80 55 85 Z" fill="#ff7b7b" />
        </g>
      ) : m === "worried" ? (
        <path
          d="M52 84 Q60 76 68 84"
          stroke="#0f5c3a"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      ) : m === "sleepy" ? (
        <path
          d="M55 79 Q60 82 65 79"
          stroke="#0f5c3a"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <path
          d="M52 76 Q60 85 68 76"
          stroke="#0f5c3a"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {m === "sleepy" && (
        <g fill="#6b6e77" fontWeight="800" fontFamily="Nunito, sans-serif">
          <text x="92" y="36" fontSize="15">
            z
          </text>
          <text x="101" y="24" fontSize="11">
            z
          </text>
        </g>
      )}
    </svg>
  );
}
