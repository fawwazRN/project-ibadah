// "Kak Peci" — karakter konselor BK. Tanpa mata/wajah (mengikuti adab sunnah);
// ekspresi disampaikan lewat gerak tubuh, kemiringan, dan aksesori kecil.
// mood: talk | care | happy | think
const CSS = `
@keyframes bk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes bk-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes bk-hop{0%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}}
@keyframes bk-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes bk-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes bk-grump{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
.bk-m{transform-box:fill-box;transform-origin:50% 100%}
.bk-talk{animation:bk-bob 1.8s ease-in-out infinite}
.bk-care{animation:bk-sway 3.2s ease-in-out infinite}
.bk-happy{animation:bk-hop 1.1s ease-in-out infinite}
.bk-think{animation:bk-sway 4.5s ease-in-out infinite}
.bk-sad{transform:rotate(-5deg) translateY(3px);transform-origin:60px 100px}
.bk-verySad{transform:rotate(-9deg) translateY(5px);transform-origin:60px 100px}
.bk-upset{transform:rotate(4deg) translateY(2px);transform-origin:60px 100px}
.bk-angry{animation:bk-grump .38s ease-in-out infinite;transform-origin:60px 100px}
.bk-acc{transform-box:fill-box;transform-origin:50% 50%;animation:bk-pop .45s cubic-bezier(.34,1.56,.64,1) both}
@media (prefers-reduced-motion:reduce){.bk-m,.bk-acc{animation:none!important}}
`;

export function BkMascot({ mood = "talk", size = 96, className = "" }) {
  const moods = {
    sad: "sedih",
    verySad: "sangat sedih",
    upset: "baper",
    angry: "marah",
    happy: "senang",
    think: "sedang berpikir",
    care: "peduli",
    talk: "siap mengobrol",
  };
  const moodLabel = moods[mood] ?? moods.talk;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Kak Peci sedang ${moodLabel}`}
      className={className}>
      <style>{CSS}</style>
      <ellipse cx="60" cy="113" rx="30" ry="5" fill="#000" opacity=".08" />

      <g className={`bk-m bk-${mood}`}>
        {/* kaki */}
        <ellipse cx="47" cy="106" rx="10" ry="5" fill="#0f7a4a" />
        <ellipse cx="73" cy="106" rx="10" ry="5" fill="#0f7a4a" />

        {/* badan bulat (gamis) */}
        <path d="M22 100 C14 70 26 38 60 38 C94 38 106 70 98 100 C86 108 34 108 22 100Z" fill="#168a57" />
        <path d="M24 94 C17 68 28 42 60 42 C92 42 103 68 96 94 C84 101 36 101 24 94Z" fill="#22b573" />
        {/* dada terang + kancing */}
        <path d="M48 52 C52 70 52 88 50 100 L70 100 C68 88 68 70 72 52 C66 46 54 46 48 52Z" fill="#e6f7ee" />
        <circle cx="60" cy="66" r="2" fill="#168a57" />
        <circle cx="60" cy="78" r="2" fill="#168a57" />
        <circle cx="60" cy="90" r="2" fill="#168a57" />

        {/* tangan */}
        <ellipse cx="24" cy="78" rx="7" ry="12" fill="#168a57" transform="rotate(14 24 78)" />
        <ellipse cx="96" cy="78" rx="7" ry="12" fill="#168a57" transform="rotate(-14 96 78)" />

        {/* songkok */}
        <path d="M34 40 C34 20 46 14 60 14 C74 14 86 20 86 40 L86 44 C72 50 48 50 34 44Z" fill="#2b2d33" />
        <path d="M34 40 C48 46 72 46 86 40 L86 45 C72 51 48 51 34 45Z" fill="#ffc21a" />
        <circle cx="60" cy="26" r="3" fill="#ffc21a" />
      </g>

      {/* aksesori sesuai suasana */}
      {mood === "care" && (
        <path
          className="bk-acc"
          d="M98 22c-3-6-12-3-9 4 2 4 9 9 9 9s7-5 9-9c3-7-6-10-9-4z"
          fill="#ef4d43"
        />
      )}
      {mood === "happy" && (
        <g className="bk-acc" fill="#ffc21a">
          <path d="M100 18l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
          <path d="M18 30l1.6 3.8 3.8 1.6-3.8 1.6L18 40.8l-1.6-3.8-3.8-1.6 3.8-1.6z" />
        </g>
      )}
      {mood === "think" && (
        <g fill="#6b6e77">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={92 + i * 9}
              cy={22 - i * 3}
              r={2.6 + i * 0.6}
              style={{ animation: `bk-dot 1.2s ${i * 0.2}s infinite` }}
            />
          ))}
        </g>
      )}
      {mood === "sad" && (
        <g className="bk-acc">
          <path d="M84 13c0-5 4-9 9-9 4 0 7 2 8 6 5-1 9 3 9 8H84c-2-1-2-4 0-5z" fill="#dbeafe" stroke="#7aa8d8" strokeWidth="1.5" />
          <path d="M91 22c-3 4-2 7 0 7s3-3 0-7zM101 22c-3 4-2 7 0 7s3-3 0-7z" fill="#60a5fa" />
        </g>
      )}
      {mood === "verySad" && (
        <g className="bk-acc">
          <path d="M82 13c0-5 4-9 9-9 4 0 7 2 8 6 5-1 9 3 9 8H82c-2-1-2-4 0-5z" fill="#cbd5e1" stroke="#8495aa" strokeWidth="1.5" />
          <path d="M88 22c-4 5-2 9 0 9s4-4 0-9zM98 22c-4 5-2 9 0 9s4-4 0-9zM108 22c-4 5-2 9 0 9s4-4 0-9z" fill="#60a5fa" />
        </g>
      )}
      {mood === "upset" && (
        <g className="bk-acc">
          <path d="M89 5c-1-4 4-6 6-2l1 4 3-5c2-3 7 0 5 3l-3 5 5-1c4-1 5 5 1 6l-8 2-7-3-5 2c-3 1-5-3-2-5l5-3z" fill="#fcd9b6" stroke="#e99a62" strokeWidth="1.5" />
          <path d="M95 10l3-2M101 12l3-2" stroke="#c87549" strokeWidth="1.7" strokeLinecap="round" />
        </g>
      )}
      {mood === "angry" && (
        <g className="bk-acc">
          <path d="M99 2l3 7 7-4-3 8 8 1-7 4 5 6-8-2-2 8-4-7-6 5 1-8-8-1 7-4-4-7 8 3z" fill="#fb7185" stroke="#dc4257" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M96 13l5 5m0-5l-5 5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default BkMascot;
