import { useEffect } from "react";

// Pasang skin + aksen peran di <html> (supaya modal/toast yang di-portal ikut),
// dan samakan warna bilah status browser (theme-color).
export function useShell({ skin, qism, themeColor }) {
  useEffect(() => {
    const el = document.documentElement;
    const prevSkin = el.dataset.skin;
    const prevQism = el.dataset.qism;
    el.dataset.skin = skin;
    if (qism) el.dataset.qism = qism;
    else delete el.dataset.qism;

    const meta = document.querySelector('meta[name="theme-color"]');
    const prevColor = meta?.getAttribute("content");
    if (meta && themeColor) meta.setAttribute("content", themeColor);

    return () => {
      el.dataset.skin = prevSkin ?? "play";
      if (prevQism) el.dataset.qism = prevQism;
      else delete el.dataset.qism;
      if (meta && prevColor) meta.setAttribute("content", prevColor);
    };
  }, [skin, qism, themeColor]);
}
