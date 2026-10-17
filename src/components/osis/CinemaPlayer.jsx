import { useCallback, useEffect, useRef, useState } from "react";
import {
  Armchair, ArrowLeft, Clapperboard, ExternalLink, Headphones, Maximize, Minimize,
  Play, Sparkles, X,
} from "lucide-react";
import "./osis.css";

const STEPS = [
  { icon: Headphones, title: "Pakai headset", text: "Suaranya jauh lebih hidup. Colokkan, lalu pasang di telinga." },
  { icon: Armchair, title: "Duduk tenang & santai", text: "Cari posisi paling nyaman. Biarkan semua yang lain menunggu." },
  { icon: Sparkles, title: "Enjoy", text: "Layar akan penuh dan video langsung main. Nikmati momennya." },
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
    <div ref={rootRef} className="cine-root" data-style={style} onMouseMove={wake} onTouchStart={wake} role="dialog" aria-modal="true" aria-label={file.title}>
      <div className="cine-ambient" />

      <header className="cine-bar" data-hidden={playing && barHidden}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-200/10 text-amber-200"><Clapperboard size={18} /></span>
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-[0.3em] text-amber-200">{style === "cinema" ? "FILE OSIS · BIOSKOP" : "FILE OSIS"}</p>
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
            <p className="cine-fade-in text-[10px] font-black tracking-[0.4em] text-amber-200">WAKTUNYA MENONTON</p>
            <h3 className="cine-title cine-fade-in mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl" style={{ animationDelay: "80ms" }}>
              {file.title}
            </h3>
            <p className="cine-sub cine-fade-in mx-auto mt-4 max-w-md text-sm text-white/55" style={{ animationDelay: "160ms" }}>
              Sebelum mulai, siapkan dulu tiga hal ini.
            </p>

            <ol className="mt-9 grid gap-3 text-left sm:grid-cols-3 sm:gap-4">
              {STEPS.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="cine-step" style={{ animationDelay: `${260 + i * 140}ms` }}>
                  <span className="absolute right-4 top-3 text-[2.6rem] font-black leading-none text-white/[0.06]">{i + 1}</span>
                  <div className="cine-step-ico"><Icon size={30} strokeWidth={1.7} /></div>
                  <div className="cine-step-text">
                    <h4 className="text-center text-lg font-black">{title}</h4>
                    <p className="mt-1.5 text-center text-[13px] leading-relaxed text-white/55">{text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="cine-cta cine-fade-in mt-10" style={{ animationDelay: "760ms" }}>
              <button ref={startRef} onClick={start} className="cine-start">
                <Play size={19} fill="currentColor" /> Mulai
              </button>
              <button onClick={close} className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white">
                <ArrowLeft size={14} /> Nanti saja, kembali ke arsip
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
