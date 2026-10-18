import { Clapperboard, FileVideo2, Play } from "lucide-react";
import VideoThumb from "./VideoThumb";
import { BkMascot } from "../ui/BkMascot";
import "./osis.css";

const TONES = ["amber", "emerald", "sky", "rose", "violet"];

export function toneFor(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/**
 * Folder yang "membuka" saat di-hover (atau difokus lewat keyboard):
 * panel depan menekuk ke depan, cahaya hangat keluar, dan sampai 3 video
 * terbaru melayang keluar seperti kertas — bisa langsung diklik untuk menonton.
 * Klik badan folder = masuk ke folder. Di layar sentuh (tanpa hover) kertas
 * sudah mengintip, dan ketukan langsung masuk folder.
 */
export default function OsisFolder({ folder, files = [], count = 0, onOpen, onPlay }) {
  const tone = toneFor(folder.id);
  const preview = files.slice(0, 3);
  const n = preview.length;
  // slot: 1 video → tengah, 2 video → kiri+kanan, 3 video → kiri, tengah, kanan
  const slots = n === 1 ? ["c"] : n === 2 ? ["l", "r"] : ["l", "c", "r"];

  return (
    <div className="osf" data-tone={tone}>
      <div className="osf-stage">
        <div className="osf-body">
          <div className="osf-glow" />
          <div className="osf-shadow" />
          <div className="osf-back" />

          {n === 0 && (
            <div className="osf-sheet" data-slot="c" data-solo="true" data-empty="true" aria-hidden="true">
              <div className="osf-sheet-thumb grid place-items-center text-white/30"><Clapperboard size={28} strokeWidth={1.5} /></div>
              <div className="osf-sheet-title text-fg-3">Belum ada video</div>
            </div>
          )}

          {preview.map((file, i) => (
            <button
              key={file.id}
              type="button"
              tabIndex={-1}
              className="osf-sheet"
              data-slot={slots[i]}
              data-solo={n === 1}
              data-pair={n === 2}
              onClick={() => onPlay(file)}
              aria-label={`Putar ${file.title}`}
            >
              <div className="osf-sheet-thumb">
                <VideoThumb file={file} width={480} />
                <div className="osf-sheet-play"><span><Play size={14} fill="currentColor" /></span></div>
              </div>
              <div className="osf-sheet-title">{file.title}</div>
            </button>
          ))}

          <button type="button" className="osf-front" onClick={() => onOpen(folder)} aria-label={`Buka folder ${folder.name}`}>
            <span className="osf-front-emblem"><BkMascot mood="peek" size={96} /></span>
            <span className="osf-front-count"><FileVideo2 size={12} />{count} video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
