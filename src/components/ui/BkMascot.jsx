// "Kak Peci" — karakter konselor BK. Tanpa mata/wajah (mengikuti adab sunnah);
// ekspresi disampaikan lewat gerak tubuh, tangan, kemiringan, dan aksesori.
// mood: talk | care | happy | think | wave | dance | cheer | sleep | read | clap | peek | spin
//       + sad | verySad | upset | angry
// interactive: ketuk maskot → bereaksi acak.
import { useEffect, useRef, useState } from "react";

const CSS = `
@keyframes bk-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes bk-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes bk-hop{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.92)}45%{transform:translateY(-12px) scaleY(1.04)}}
@keyframes bk-pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes bk-dot{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes bk-grump{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}
@keyframes bk-wave-arm{0%,100%{transform:rotate(0)}25%{transform:rotate(-38deg)}50%{transform:rotate(-8deg)}75%{transform:rotate(-38deg)}}
@keyframes bk-up-arm-l{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(-34deg)}}
@keyframes bk-up-arm-r{0%,100%{transform:rotate(8deg)}50%{transform:rotate(34deg)}}
@keyframes bk-dance{0%,100%{transform:translateX(0) rotate(-6deg)}25%{transform:translateX(-5px) rotate(0)}50%{transform:translateX(0) rotate(6deg)}75%{transform:translateX(5px) rotate(0)}}
@keyframes bk-clap-l{0%,100%{transform:rotate(0)}50%{transform:rotate(-22deg)}}
@keyframes bk-clap-r{0%,100%{transform:rotate(0)}50%{transform:rotate(22deg)}}
@keyframes bk-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.025,.97)}}
@keyframes bk-peek{0%,100%{transform:translateX(-14px) rotate(-8deg)}50%{transform:translateX(0) rotate(0)}}
@keyframes bk-spin{0%{transform:rotateY(0) translateY(0)}40%{transform:rotateY(180deg) translateY(-10px)}100%{transform:rotateY(360deg) translateY(0)}}
@keyframes bk-z{0%{opacity:0;transform:translate(0,6px) scale(.6)}30%{opacity:1}100%{opacity:0;transform:translate(10px,-14px) scale(1.2)}}
@keyframes bk-conf{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(34px) rotate(160deg)}}
@keyframes bk-page{0%,100%{transform:rotate(0)}50%{transform:rotate(-12deg)}}
@keyframes bk-shadow{0%,100%{transform:scaleX(1);opacity:.08}45%{transform:scaleX(.7);opacity:.04}}
.bk-m{transform-box:fill-box;transform-origin:50% 100%}
.bk-arm{transform-box:fill-box}
.bk-armL{transform-origin:70% 12%}
.bk-armR{transform-origin:30% 12%}
.bk-idle{animation:bk-breathe 3.4s ease-in-out infinite}
.bk-talk{animation:bk-bob 1.8s ease-in-out infinite}
.bk-care{animation:bk-sway 3.2s ease-in-out infinite}
.bk-happy{animation:bk-hop 1.1s ease-in-out infinite}
.bk-think{animation:bk-sway 4.5s ease-in-out infinite}
.bk-wave{animation:bk-bob 2.2s ease-in-out infinite}
.bk-wave .bk-armR{animation:bk-wave-arm .9s ease-in-out infinite;transform:rotate(-28deg)}
.bk-dance{animation:bk-dance .9s ease-in-out infinite}
.bk-dance .bk-armL{animation:bk-up-arm-l .45s ease-in-out infinite}
.bk-dance .bk-armR{animation:bk-up-arm-r .45s ease-in-out infinite}
.bk-cheer{animation:bk-hop .8s ease-in-out infinite}
.bk-cheer .bk-armL{transform:rotate(-150deg)}
.bk-cheer .bk-armR{transform:rotate(150deg)}
.bk-clap{animation:bk-bob 1s ease-in-out infinite}
.bk-clap .bk-armL{animation:bk-clap-l .35s ease-in-out infinite;transform:translate(6px,-6px) rotate(-30deg)}
.bk-clap .bk-armR{animation:bk-clap-r .35s ease-in-out infinite;transform:translate(-6px,-6px) rotate(30deg)}
.bk-sleep{transform:rotate(-7deg) translateY(4px);transform-origin:60px 100px;animation:bk-breathe 3.8s ease-in-out infinite}
.bk-read{animation:bk-sway 5s ease-in-out infinite}
.bk-read .bk-armL{transform:translate(8px,-14px) rotate(-60deg)}
.bk-read .bk-armR{transform:translate(-8px,-14px) rotate(60deg)}
.bk-peek{animation:bk-peek 2.6s ease-in-out infinite}
.bk-spin{animation:bk-spin 1.6s ease-in-out infinite}
.bk-sad{transform:rotate(-5deg) translateY(3px);transform-origin:60px 100px}
.bk-verySad{transform:rotate(-9deg) translateY(5px);transform-origin:60px 100px}
.bk-upset{transform:rotate(4deg) translateY(2px);transform-origin:60px 100px}
.bk-angry{animation:bk-grump .38s ease-in-out infinite;transform-origin:60px 100px}
.bk-shadow{transform-box:fill-box;transform-origin:center;animation:bk-shadow 1.1s ease-in-out infinite}
.bk-acc{transform-box:fill-box;transform-origin:50% 50%;animation:bk-pop .45s cubic-bezier(.34,1.56,.64,1) both}
.bk-tap{cursor:pointer;-webkit-tap-highlight-color:transparent}
@media (prefers-reduced-motion:reduce){.bk-m,.bk-acc,.bk-arm,.bk-shadow,.bk-z,.bk-cf,.bk-page{animation:none!important}}
`;

const MOODS = {
  sad: "sedih", verySad: "sangat sedih", upset: "baper", angry: "marah", happy: "senang",
  think: "sedang berpikir", care: "peduli", talk: "siap mengobrol", wave: "melambaikan tangan",
  dance: "menari", cheer: "bersorak", sleep: "tidur", read: "membaca", clap: "bertepuk tangan",
  peek: "mengintip", spin: "berputar", idle: "santai",
};
const REACTIONS = ["wave", "dance", "cheer", "spin", "clap", "happy"];
const BOUNCY = new Set(["happy", "cheer", "dance", "spin"]);

export function BkMascot({ mood = "talk", size = 96, className = "", interactive = false }) {
  const [reaction, setReaction] = useState(null);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const tap = () => {
    if (!interactive) return;
    const pick = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setReaction(pick);
    navigator.vibrate?.(12);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReaction(null), 2200);
  };

  const m = reaction ?? mood;
  const moodLabel = MOODS[m] ?? MOODS.talk;

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`Kak Peci sedang ${moodLabel}`}
      className={`${className} ${interactive ? "bk-tap" : ""}`}
      onClick={tap}
      style={{ overflow: "visible" }}>
      <style>{CSS}</style>
      <ellipse className={BOUNCY.has(m) ? "bk-shadow" : ""} cx="60" cy="113" rx="30" ry="5" fill="#000" opacity=".08" />

      <g className={`bk-m bk-${m}`}>
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

        {/* tangan (bisa bergerak) */}
        <g className="bk-arm bk-armL">
          <ellipse cx="24" cy="78" rx="7" ry="12" fill="#168a57" transform="rotate(14 24 78)" />
        </g>
        <g className="bk-arm bk-armR">
          <ellipse cx="96" cy="78" rx="7" ry="12" fill="#168a57" transform="rotate(-14 96 78)" />
        </g>

        {/* buku saat membaca */}
        {m === "read" && (
          <g>
            <path d="M40 74 L60 80 L80 74 L80 92 L60 98 L40 92Z" fill="#fff7e0" stroke="#d99a00" strokeWidth="2" strokeLinejoin="round" />
            <path d="M60 80 L60 98" stroke="#d99a00" strokeWidth="2" />
            <path className="bk-page" style={{ transformBox: "fill-box", transformOrigin: "0 50%", animation: "bk-page 2.4s ease-in-out infinite" }} d="M62 82 L78 77 L78 88 L62 92Z" fill="#fff" stroke="#e8c15a" strokeWidth="1" />
          </g>
        )}

        {/* songkok */}
        <path d="M34 40 C34 20 46 14 60 14 C74 14 86 20 86 40 L86 44 C72 50 48 50 34 44Z" fill="#2b2d33" />
        <path d="M34 40 C48 46 72 46 86 40 L86 45 C72 51 48 51 34 45Z" fill="#ffc21a" />
        <circle cx="60" cy="26" r="3" fill="#ffc21a" />
      </g>

      {/* aksesori sesuai suasana */}
      {(m === "care") && (
        <path className="bk-acc" d="M98 22c-3-6-12-3-9 4 2 4 9 9 9 9s7-5 9-9c3-7-6-10-9-4z" fill="#ef4d43" />
      )}
      {(m === "happy" || m === "wave" || m === "spin") && (
        <g className="bk-acc" fill="#ffc21a">
          <path d="M100 18l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
          <path d="M18 30l1.6 3.8 3.8 1.6-3.8 1.6L18 40.8l-1.6-3.8-3.8-1.6 3.8-1.6z" />
        </g>
      )}
      {(m === "cheer" || m === "dance" || m === "clap") && (
        <g>
          {[["#ffc21a", 22, 14], ["#2f80f0", 98, 10], ["#ef4d43", 40, 6], ["#9b6cf2", 82, 4], ["#22b573", 60, 2]].map(([c, x, y], i) => (
            <rect
              key={i}
              className="bk-cf"
              x={x}
              y={y}
              width="5"
              height="8"
              rx="1.5"
              fill={c}
              style={{ transformBox: "fill-box", transformOrigin: "center", animation: `bk-conf 1.5s ${i * 0.22}s ease-in infinite` }}
            />
          ))}
        </g>
      )}
      {m === "dance" && (
        <g className="bk-acc" stroke="#9b6cf2" strokeWidth="2.6" strokeLinecap="round" fill="none">
          <path d="M12 52c-4-4-4-10 0-14" />
          <path d="M6 58c-7-7-7-19 0-26" />
          <path d="M108 52c4-4 4-10 0-14" />
          <path d="M114 58c7-7 7-19 0-26" />
        </g>
      )}
      {m === "sleep" && (
        <g fill="#6b6e77" fontFamily="system-ui,sans-serif" fontWeight="800">
          {[0, 1, 2].map((i) => (
            <text key={i} className="bk-z" x={90 + i * 6} y={24 - i * 6} fontSize={11 + i * 3} style={{ animation: `bk-z 2.4s ${i * 0.7}s ease-out infinite` }}>
              z
            </text>
          ))}
        </g>
      )}
      {m === "think" && (
        <g fill="#6b6e77">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={92 + i * 9} cy={22 - i * 3} r={2.6 + i * 0.6} style={{ animation: `bk-dot 1.2s ${i * 0.2}s infinite` }} />
          ))}
        </g>
      )}
      {m === "sad" && (
        <g className="bk-acc">
          <path d="M84 13c0-5 4-9 9-9 4 0 7 2 8 6 5-1 9 3 9 8H84c-2-1-2-4 0-5z" fill="#dbeafe" stroke="#7aa8d8" strokeWidth="1.5" />
          <path d="M91 22c-3 4-2 7 0 7s3-3 0-7zM101 22c-3 4-2 7 0 7s3-3 0-7z" fill="#60a5fa" />
        </g>
      )}
      {m === "verySad" && (
        <g className="bk-acc">
          <path d="M82 13c0-5 4-9 9-9 4 0 7 2 8 6 5-1 9 3 9 8H82c-2-1-2-4 0-5z" fill="#cbd5e1" stroke="#8495aa" strokeWidth="1.5" />
          <path d="M88 22c-4 5-2 9 0 9s4-4 0-9zM98 22c-4 5-2 9 0 9s4-4 0-9zM108 22c-4 5-2 9 0 9s4-4 0-9z" fill="#60a5fa" />
        </g>
      )}
      {m === "upset" && (
        <g className="bk-acc">
          <path d="M89 5c-1-4 4-6 6-2l1 4 3-5c2-3 7 0 5 3l-3 5 5-1c4-1 5 5 1 6l-8 2-7-3-5 2c-3 1-5-3-2-5l5-3z" fill="#fcd9b6" stroke="#e99a62" strokeWidth="1.5" />
          <path d="M95 10l3-2M101 12l3-2" stroke="#c87549" strokeWidth="1.7" strokeLinecap="round" />
        </g>
      )}
      {m === "angry" && (
        <g className="bk-acc">
          <path d="M99 2l3 7 7-4-3 8 8 1-7 4 5 6-8-2-2 8-4-7-6 5 1-8-8-1 7-4-4-7 8 3z" fill="#fb7185" stroke="#dc4257" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M96 13l5 5m0-5l-5 5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export default BkMascot;
