import { useEffect, useRef, useState } from "react";

// Progress scroll [0..1] untuk satu elemen relatif viewport.
// 0 = elemen belum masuk, 0.5 = elemen di tengah layar, 1 = sudah lewat.
export function useScrollProgress(threshold = 0) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = null;
    const compute = () => {
      raf = null;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: 0 saat top elemen menyentuh bawah viewport,
      // 1 saat bottom elemen menyentuh atas viewport
      const total = rect.height + vh;
      const passed = vh - rect.top;
      const p = Math.min(1, Math.max(0, passed / total));
      if (p > threshold) setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return [ref, progress];
}
