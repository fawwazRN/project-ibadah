import { useCallback, useEffect, useRef, useState } from "react";
import {
  Armchair, ArrowLeft, Clapperboard, ExternalLink, Headphones, Maximize, Minimize,
  Play, Sparkles, X,
} from "lucide-react";
import { BkMascot } from "../ui/BkMascot";
import "./osis.css";

const STEPS = [
  { c: "#1cb0f6", icon: Headphones, title: "Pakai headset", text: "Suaranya jauh lebih hidup. Colokkan, lalu pasang di telinga." },
  { c: "#ff9600", icon: Armchair, title: "Duduk tenang & santai", text: "Cari posisi paling nyaman. Biarkan semua yang lain menunggu." },
  { c: "#58cc02", icon: Sparkles, title: "Enjoy", text: "Layar akan penuh dan video langsung main. Nikmati momennya." },
];

const requestFs = (el) => (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
const exitFs = () => (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;

/**
 * Pemutar layar penuh bergaya bioskop.
 *   tahap 1 (briefing): arahan headset → duduk tenang → enjoy, tombol MULAI
 *   tahap 2 (putar)   : klik MULAI → layar penuh + video langsung diputar
 * file.player_style: "cinema" (layar lebar 21:9) | "normal" (bingkai 16:9)
 */
export default function CinemaPlayer({ file, onClose }) {
  const rootRef = useRef(null);
  const startRef = useRef(null);
  const idleTimer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const style = file.player_style === "cinema" ? "cinema" : "normal";

  const close = useCallback(async () => {
    try { if (fsElement()) await exitFs(); } catch { /* abaikan */ }
    try { screen.orientation?.unlock?.(); } catch { /* abaikan */ }
    onClose();
  }, [onClose]);

  // fokus ke tombol Mulai (Enter langsung memulai) tanpa menggeser scroll
  useEffect(() => { startRef.current?.focus({ preventScroll: true }); }, []);

  // kunci scroll halaman di belakang + Esc untuk menutup
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape" && !fsElement()) close(); };
    const onFs = () => setIsFs(!!fsElement());
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      clearTimeout(idleTimer.current);
      try { if (fsElement()) exitFs(); } catch { /* abaikan */ }
    };
  }, [close]);

  // bar atas menghilang sendiri saat menonton, muncul lagi saat mouse digerakkan
  const wake = useCallback(() => {
    setBarHidden(false);
    clearTimeout(idleTimer.current);
    if (playing) idleTimer.current = setTimeout(() => setBarHidden(true), 2800);
  }, [playing]);
  useEffect(() => { wake(); }, [wake]);

  const start = async () => {
    // Dipanggil langsung dari klik → browser mengizinkan fullscreen.
    setPlaying(true);
    try { await requestFs(rootRef.current); } catch { /* beberapa browser (mis. iPhone) menolak; overlay tetap penuh */ }
    if (style === "cinema") {
      try { await screen.orientation?.lock?.("landscape"); } catch { /* tidak didukung → abaikan */ }
    }
  };

  const toggleFs = async () => {
    try { fsElement() ? await exitFs() : await requestFs(rootRef.current); } catch { /* abaikan */ }
  };

  const embedUrl = file.drive_file_id
    ? `https://drive.google.com/file/d/${file.drive_file_id}/preview?autoplay=1`
    : null;

  return (
    <div ref={rootRef} className="cine-root" data-style={style} data-phase={playing ? "play" : "brief"} onMouseMove={wake} onTouchStart={wake} role="dialog" aria-modal="true" aria-label={file.title}>
      <div className="cine-ambient" />

      <header className="cine-bar" data-hidden={playing && barHidden}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#58cc02] text-white"><Clapperboard size={18} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.3em] text-[#58a700]">{style === "cinema" ? "FILE OSIS · BIOSKOP" : "FILE OSIS"}</p>
            <h2 className="truncate text-sm font-extrabold">{file.title}</h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {playing && file.drive_file_id && (
            <a
              href={`https://drive.google.com/file/d/${file.drive_file_id}/view`}
              target="_blank" rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white sm:inline-flex"
            >Buka di Drive <ExternalLink size={13} /></a>
          )}
          {playing && (
            <button onClick={toggleFs} aria-label={isFs ? "Keluar layar penuh" : "Layar penuh"} className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/10">
              {isFs ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          )}
          <button onClick={close} aria-label="Tutup pemutar" className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/80 transition hover:bg-white/10"><X size={18} /></button>
        </div>
      </header>

      {!playing ? (
        <div className="cine-brief">
          <div>
            <div className="cine-fade-in flex justify-center"><BkMascot mood="wave" size={104} /></div>
            <h3 className="cine-title cine-fade-in mt-2 text-3xl font-black leading-tight tracking-tight text-[#3c3c3c] sm:text-5xl" style={{ animationDelay: "80ms" }}>
              {file.title}
            </h3>
            <p className="cine-sub cine-fade-in mx-auto mt-3 max-w-md text-sm font-bold text-[#777]" style={{ animationDelay: "160ms" }}>
              Siapkan tiga hal ini dulu, ya!
            </p>

            <ol className="mt-7 grid gap-3 text-left sm:grid-cols-3 sm:gap-4">
              {STEPS.map(({ icon: Icon, title, text, c }, i) => (
                <li key={title} className="cdu-step" style={{ animationDelay: `${260 + i * 120}ms` }}>
                  <div className="cdu-ico" style={{ background: c }}><Icon size={28} strokeWidth={2} /></div>
                  <div className="cine-step-text">
                    <h4 className="text-center text-lg font-black text-[#3c3c3c]">{title}</h4>
                    <p className="mt-1 text-center text-[13px] font-semibold leading-relaxed text-[#777]">{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="cine-cta cine-fade-in mt-8" style={{ animationDelay: "700ms" }}>
              <button ref={startRef} onClick={start} className="cdu-start">
                <Play size={19} fill="currentColor" /> Mulai
              </button>
              <button onClick={close} className="mx-auto mt-4 flex items-center gap-1.5 text-sm font-bold text-[#afafaf] transition hover:text-[#777]">
                <ArrowLeft size={14} /> Nanti saja
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cine-stage">
          {embedUrl ? (
            <div className="cine-screen">
              <iframe
                src={embedUrl}
                title={file.title}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <p className="text-white/70">Tautan Drive ini belum memiliki ID video yang valid.</p>
          )}
          <p className="cine-hint pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/70 backdrop-blur">
            Kalau belum jalan otomatis, tekan ▶ di tengah layar
          </p>
        </div>
      )}
    </div>
  );
}
