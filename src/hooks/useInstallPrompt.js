import { useEffect, useState } from "react";

// Tangkap `beforeinstallprompt` sedini mungkin (modul ini diimpor di main.jsx),
// supaya tombol "Pasang aplikasi" bisa muncul kapan saja.
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function useInstallPrompt() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);

  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true);
  const isIOS =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    installed: standalone,
    canInstall: !!deferred && !standalone,
    // iOS tidak punya prompt — tampilkan petunjuk "Bagikan → Tambah ke Layar Utama"
    iosHint: isIOS && !standalone,
    install: async () => {
      if (!deferred) return;
      deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        /* diabaikan */
      }
      deferred = null;
      notify();
    },
  };
}
