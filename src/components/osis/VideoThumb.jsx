import { useState } from "react";
import { Film } from "lucide-react";

export const driveThumbUrl = (id, width = 640) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;

// Warna latar cadangan yang konsisten per judul, kalau thumbnail Drive tidak bisa dimuat.
const FALLBACKS = [
  ["#1f2a44", "#3b2f63"],
  ["#143b34", "#1f5a4c"],
  ["#3d2a1b", "#6b4423"],
  ["#2a1f3d", "#4c2d5c"],
  ["#102a3d", "#1c4a6b"],
];
function pickFallback(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}

/**
 * Poster video. Memakai thumbnail Google Drive; bila gagal (file privat / belum
 * diproses) tampil gradient sinematik, jadi kartu tidak pernah terlihat "rusak".
 */
export default function VideoThumb({ file, width = 640, className = "", children }) {
  const [failed, setFailed] = useState(false);
  const [from, to] = pickFallback(file?.title || file?.id);
  const showImage = file?.drive_file_id && !failed;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {!showImage && (
        <div className="absolute inset-0 grid place-items-center text-white/25">
          <Film size={34} strokeWidth={1.5} />
        </div>
      )}
      {showImage && (
        <img
          src={driveThumbUrl(file.drive_file_id, width)}
          alt=""
          loading="lazy"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  );
}
