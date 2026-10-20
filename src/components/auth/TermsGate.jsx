import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isPresentationEmail } from "../../lib/constants";
import { TERMS, termsAccepted, markTermsAccepted } from "./TermsConsent";

// Syarat & Ketentuan layar penuh — tampil setiap kali santri MASUK web (sesi browser baru),
// juga bagi yang sudah login sebelumnya. Harus disetujui dulu sebelum web bisa dipakai.
// Tidak berlaku untuk akun presentasi (TV) dan portal orang tua (/ortu).
export default function TermsGate() {
  const { session, isGuest, booting, signOut } = useAuth();
  const { pathname } = useLocation();
  const [ok, setOk] = useState(termsAccepted);

  const email = session?.user?.email;
  const need =
    !booting &&
    !ok &&
    (!!session || isGuest) &&
    !isPresentationEmail(email) &&
    !pathname.startsWith("/ortu") &&
    !pathname.startsWith("/auth");

  // Keluar/masuk akun lagi → tanyakan ulang
  useEffect(() => {
    if (!session && !isGuest) setOk(termsAccepted());
  }, [session, isGuest]);

  useEffect(() => {
    if (!need) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [need]);

  if (!need) return null;

  const agree = () => {
    markTermsAccepted();
    setOk(true);
  };
  const icons = [ShieldCheck, Clock];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Syarat dan Ketentuan"
      className="z-[600] fixed inset-0 flex flex-col bg-page safe-top safe-bottom">
      <div className="flex flex-col flex-1 justify-center mx-auto p-5 w-full max-w-md min-h-0 overflow-y-auto">
        <div className="text-center">
          <span className="place-items-center inline-grid bg-brand/10 rounded-2xl size-14 text-brand-dim">
            <ShieldCheck size={30} />
          </span>
          <h1 className="mt-3 font-display text-fg text-2xl" style={{ fontWeight: 900 }}>
            Syarat &amp; Ketentuan
          </h1>
          <p className="mt-1 font-semibold text-fg-3 text-sm leading-relaxed">
            Sebelum menggunakan aplikasi, santri wajib mematuhi ketentuan berikut:
          </p>
        </div>

        <ol className="space-y-3 my-5">
          {TERMS.map((t, i) => {
            const Icon = icons[i % icons.length];
            return (
              <li key={t.title} className="flex gap-3 bg-soft p-3.5 border-2 border-line rounded-2xl">
                <span className="place-items-center grid bg-brand rounded-xl size-9 text-on-brand shrink-0">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-fg text-sm">{t.title}</p>
                  <p className="mt-0.5 font-semibold text-fg-3 text-xs leading-relaxed">{t.text}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          onClick={agree}
          className="bg-brand py-3.5 rounded-2xl w-full font-extrabold text-on-brand text-base">
          Saya sudah membaca &amp; setuju
        </button>
        <button
          onClick={signOut}
          className="mt-3 py-2 font-bold text-fg-3 text-xs underline">
          Saya tidak setuju — keluar
        </button>
      </div>
    </div>
  );
}
