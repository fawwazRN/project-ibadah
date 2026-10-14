import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenCheck, Flag, Footprints, Volleyball } from "lucide-react";
import { BkMascot } from "../ui/BkMascot";

const SLIDE_MS = 6000;
const OUT_MS = 900;

const QISM = {
  Ibadah: { icon: Flag, q: "q-ibadah" },
  Nadzhofah: { icon: Footprints, q: "q-nadzhofah" },
  Lughah: { icon: BookOpenCheck, q: "q-lughah" },
  Riyadhah: { icon: Volleyball, q: "q-riyadhah" },
};

export const SLIDES = [
  {
    lines: ["Empat qism,", "satu aplikasi."],
    text: "Semua kegiatan madrasah tersusun rapi. Pilih qism dan temukan aktivitasmu.",
    mood: "wave",
    qism: ["Ibadah", "Nadzhofah", "Lughah", "Riyadhah"],
    bg: "radial-gradient(120% 90% at 50% 0%, #34d399 0%, #22b573 45%, #148a58 100%)",
  },
  {
    lines: ["Ibadah lebih", "terpantau."],
    text: "Lihat jadwal, catatan, dan progres ibadahmu dalam satu tempat.",
    mood: "care",
    qism: ["Ibadah"],
    bg: "radial-gradient(120% 90% at 50% 0%, #5aa2ff 0%, #2f80f0 45%, #1c57b8 100%)",
  },
  {
    lines: ["Lingkungan bersih,", "hati senang."],
    text: "Ikuti kegiatan Nadzhofah dan jaga lingkungan bersama teman-teman.",
    mood: "dance",
    qism: ["Nadzhofah"],
    bg: "radial-gradient(120% 90% at 50% 0%, #ffb340 0%, #f08c00 45%, #b86400 100%)",
  },
  {
    lines: ["Belajar sedikit", "demi sedikit."],
    text: "Pantau kegiatan Lughah dan terus tambah progres belajarmu.",
    mood: "read",
    qism: ["Lughah"],
    bg: "radial-gradient(120% 90% at 50% 0%, #b794f6 0%, #9b6cf2 45%, #6b3fcb 100%)",
  },
  {
    lines: ["Main kompak,", "dukung tim."],
    text: "Ikuti kabar Riyadhah, jadwal pertandingan, dan klasemen liga.",
    mood: "cheer",
    qism: ["Riyadhah"],
    bg: "radial-gradient(120% 90% at 50% 0%, #ff7a70 0%, #ef4d43 45%, #b02a22 100%)",
  },
];

const DECOR = [
  { l: "8%", t: "14%", s: 14, d: 7, k: "dot" },
  { l: "86%", t: "10%", s: 22, d: 9, k: "spark" },
  { l: "78%", t: "36%", s: 10, d: 6, k: "dot" },
  { l: "12%", t: "46%", s: 18, d: 8, k: "spark" },
  { l: "90%", t: "62%", s: 16, d: 10, k: "dot" },
  { l: "20%", t: "78%", s: 12, d: 7, k: "dot" },
  { l: "70%", t: "84%", s: 20, d: 9, k: "spark" },
];

function Words({ lines }) {
  let i = 0;
  return lines.map((line, li) => (
    <span key={li} className="block">
      {line.split(" ").map((w) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom">
          <span className="inline-block intro-word" style={{ "--i": i++ }}>
            {w}&nbsp;
          </span>
        </span>
      ))}
    </span>
  ));
}

function Orbit({ names }) {
  return (
    <div className="absolute inset-0 intro-orbit pointer-events-none" aria-hidden="true">
      {names.map((n, i) => {
        const Q = QISM[n];
        const ang = (360 / names.length) * i;
        return (
          <span
            key={n}
            className="absolute top-1/2 left-1/2"
            style={{ transform: `rotate(${ang}deg) translateX(150px) rotate(${-ang}deg)` }}>
            <span className={`${Q.q} intro-orbit-ico grid place-items-center bg-white rounded-2xl size-11 shadow-lg -mt-[22px] -ml-[22px]`} style={{ color: "var(--q-dim)" }}>
              <Q.icon size={20} strokeWidth={2.6} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Content({ index, leaving }) {
  const s = SLIDES[index];
  return (
    <div className={`flex flex-col items-center text-center [grid-area:1/1] ${leaving ? "intro-out" : "intro-in"}`}>
      <div className="relative grid place-items-center w-[300px] h-[300px]" data-parallax>
        <div className="absolute inset-6 bg-white/15 rounded-full intro-halo" />
        {!leaving && <Orbit names={s.qism} />}
        <BkMascot mood={s.mood} size={220} interactive className="relative intro-mascot" />
      </div>
      <h1 className="mt-2 font-display text-4xl leading-tight" style={{ fontWeight: 900 }}>
        <Words lines={s.lines} />
      </h1>
      <p className="mx-auto mt-3 max-w-md font-semibold text-white/90 text-sm leading-relaxed intro-fade">{s.text}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        {s.qism.map((name, i) => {
          const Q = QISM[name];
          return (
            <span
              key={name}
              className={`${Q.q} intro-chip inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-extrabold shadow-md`}
              style={{ color: "var(--q-dim)", "--i": i }}>
              <Q.icon size={16} strokeWidth={2.6} /> {name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function IntroStage({ paused }) {
  const [state, setState] = useState({ cur: 0, prev: null });
  const root = useRef(null);
  const timer = useRef();

  const go = useCallback((to) => {
    setState((s) => (to === s.cur ? s : { cur: to, prev: s.cur }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((s) => ({ ...s, prev: null })), OUT_MS);
  }, []);
  const next = useCallback(() => setState((s) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState((x) => ({ ...x, prev: null })), OUT_MS);
    return { cur: (s.cur + 1) % SLIDES.length, prev: s.cur };
  }), []);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Parallax halus mengikuti pointer (tanpa re-render)
  const onMove = (e) => {
    const el = root.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--px", `${(x * 18).toFixed(1)}px`);
    el.style.setProperty("--py", `${(y * 12).toFixed(1)}px`);
  };

  const { cur, prev } = state;

  return (
    <div ref={root} onMouseMove={onMove} className="absolute inset-0 flex flex-col justify-between p-12 text-white intro-root">
      {/* Latar: lapisan lama tetap, lapisan baru membuka seperti tinta */}
      {prev !== null && <div className="absolute inset-0" style={{ background: SLIDES[prev].bg }} />}
      <div key={`bg-${cur}`} className={`absolute inset-0 ${prev !== null ? "intro-ink" : ""}`} style={{ background: SLIDES[cur].bg }} />
      <div className="absolute inset-0 opacity-70 bg-lattice" aria-hidden="true" />
      {DECOR.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`absolute intro-decor ${d.k === "dot" ? "rounded-full bg-white/30" : "bg-white/70"}`}
          style={{
            left: d.l, top: d.t, width: d.s, height: d.s, animationDuration: `${d.d}s`, animationDelay: `${i * -1.3}s`,
            clipPath: d.k === "spark" ? "polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)" : undefined,
          }}
        />
      ))}

      <div className="relative">
        <span className="font-display text-4xl" style={{ fontWeight: 900, letterSpacing: "-0.03em" }}>osis</span>
      </div>

      <div className="relative grid justify-items-center" aria-live="polite" aria-atomic="true">
        {prev !== null && <Content key={`o-${prev}`} index={prev} leaving />}
        <Content key={`i-${cur}`} index={cur} />
      </div>

      <div className="relative">
        <div className="flex justify-center items-center gap-2 mb-6" role="group" aria-label="Pilih pengenalan fitur">
          {SLIDES.map((s, i) => (
            <button
              key={s.text}
              type="button"
              aria-label={`Tampilkan fitur ${i + 1}`}
              aria-current={cur === i ? "step" : undefined}
              onClick={() => go(i)}
              className={`relative overflow-hidden rounded-full h-2.5 transition-all duration-500 ${cur === i ? "bg-white/35 w-10" : "bg-white/45 hover:bg-white/70 w-2.5"}`}>
              {cur === i && (
                <span
                  key={`f-${cur}`}
                  className="absolute inset-0 bg-white rounded-full intro-dot-fill"
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                  onAnimationEnd={next}
                />
              )}
            </button>
          ))}
        </div>
        <p className="font-semibold text-white/80 text-xs">© {new Date().getFullYear()} OSIS · Penggunaan internal madrasah</p>
      </div>
    </div>
  );
}
