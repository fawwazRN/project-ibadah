import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BookOpenCheck,
  Download,
  Eye,
  Flag,
  Footprints,
  MailCheck,
  Volleyball,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useShell } from "../../hooks/useShell";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Mascot } from "../../components/ui/Mascot";
import { BkMascot } from "../../components/ui/BkMascot";
import { entryPath } from "../../routes/AppRoutes";

const QISM = [
  { icon: Flag, name: "Ibadah", q: "q-ibadah" },
  { icon: Footprints, name: "Nadzhofah", q: "q-nadzhofah" },
  { icon: BookOpenCheck, name: "Lughah", q: "q-lughah" },
  { icon: Volleyball, name: "Riyadhah", q: "q-riyadhah" },
];

const INTRO_SLIDES = [
  {
    title: <>Empat qism,<br />satu aplikasi.</>,
    description: "Semua kegiatan madrasah tersusun rapi. Pilih qism dan temukan aktivitasmu.",
    mood: "happy",
    qism: QISM.map((item) => item.name),
  },
  {
    title: "Ibadah lebih terpantau.",
    description: "Lihat jadwal, catatan, dan progres ibadahmu dalam satu tempat.",
    mood: "care",
    qism: ["Ibadah"],
  },
  {
    title: "Lingkungan bersih, hati senang.",
    description: "Ikuti kegiatan Nadzhofah dan jaga lingkungan bersama teman-teman.",
    mood: "happy",
    qism: ["Nadzhofah"],
  },
  {
    title: "Belajar sedikit demi sedikit.",
    description: "Pantau kegiatan Lughah dan terus tambah progres belajarmu.",
    mood: "think",
    qism: ["Lughah"],
  },
  {
    title: "Main kompak, dukung tim.",
    description: "Ikuti kabar Riyadhah, jadwal pertandingan, dan klasemen liga.",
    mood: "happy",
    qism: ["Riyadhah"],
  },
];

export default function LoginPage() {
  useShell({ skin: "play", qism: null, themeColor: "#ffffff" });
  const { session, profile, booting, signIn, signUp, enterGuest } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const { canInstall, install, iosHint } = useInstallPrompt();

  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [introIndex, setIntroIndex] = useState(0);
  const [introPaused, setIntroPaused] = useState(false);

  useEffect(() => {
    if (introPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setIntroIndex((index) => (index + 1) % INTRO_SLIDES.length);
      }
    }, 6000);
    return () => window.clearInterval(timer);
  }, [introPaused]);

  if (booting) return null;
  if (session) {
    if (!profile) return <Navigate to="/claim" replace />;
    return <Navigate to={entryPath(profile.role)} replace />;
  }

  const switchTab = (k) => {
    setTab(k);
    setFormError("");
    setNeedVerify(false);
    setErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Masukkan email yang valid.";
    if (password.length < 6) errs.password = "Kata sandi minimal 6 karakter.";
    setErrors(errs);
    setFormError("");
    setNeedVerify(false);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      if (tab === "login") {
        const p = await signIn(email.trim().toLowerCase(), password);
        push("success", "Berhasil masuk");
        navigate(p ? entryPath(p.role) : "/claim", { replace: true });
      } else {
        const res = await signUp(email.trim().toLowerCase(), password);
        if (res.verified) {
          push("success", "Akun berhasil dibuat");
          navigate(res.profile ? entryPath(res.profile.role) : "/claim", { replace: true });
        } else {
          setNeedVerify(true);
        }
      }
    } catch (err) {
      setFormError(err.message ?? "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-page min-h-dvh">
      {/* Panel kiri (desktop) */}
      <aside
        className="hidden relative lg:flex flex-col justify-between bg-brand p-12 w-[46%] overflow-hidden bg-lattice text-on-brand"
        onMouseEnter={() => setIntroPaused(true)}
        onMouseLeave={() => setIntroPaused(false)}
        onFocus={() => setIntroPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIntroPaused(false);
        }}>
        <div className="flex items-center gap-2">
          <span className="font-display text-4xl" style={{ fontWeight: 900, letterSpacing: "-0.03em" }}>
            osis
          </span>
        </div>
        <div className="flex flex-col items-center text-center" aria-live="polite" aria-atomic="true">
          <BkMascot
            key={introIndex}
            mood={INTRO_SLIDES[introIndex].mood}
            size={220}
            className="login-mascot-enter"
          />
          <div key={`copy-${introIndex}`} className="login-feature-enter">
            <h1 className="mt-6 font-display text-4xl leading-tight" style={{ fontWeight: 900 }}>
              {INTRO_SLIDES[introIndex].title}
            </h1>
            <p className="mx-auto mt-3 max-w-md font-semibold text-white/85 text-sm leading-relaxed">
              {INTRO_SLIDES[introIndex].description}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {INTRO_SLIDES[introIndex].qism.map((name) => {
                const item = QISM.find((qism) => qism.name === name);
                if (!item) return null;
                return (
                  <span
                    key={item.name}
                    className={`${item.q} inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-extrabold`}
                    style={{ color: "var(--q-dim)" }}>
                    <item.icon size={16} strokeWidth={2.6} /> {item.name}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-7" role="group" aria-label="Pilih pengenalan fitur">
            <div className="flex items-center gap-2">
              {INTRO_SLIDES.map((slide, index) => (
                <button
                  key={slide.description}
                  type="button"
                  aria-label={`Tampilkan fitur ${index + 1}`}
                  aria-current={introIndex === index ? "step" : undefined}
                  onClick={() => setIntroIndex(index)}
                  className={`rounded-full h-2.5 transition-all duration-500 ${introIndex === index ? "bg-white w-7" : "bg-white/45 hover:bg-white/70 w-2.5"}`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="font-semibold text-white/80 text-xs">
          © {new Date().getFullYear()} OSIS · Penggunaan internal madrasah
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-1 justify-center items-center p-5 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-6 text-center">
            <Mascot mood="cheer" size={112} wave className="animate-float" />
            <p className="mt-1 font-display text-brand-dim text-4xl" style={{ fontWeight: 900, letterSpacing: "-0.03em" }}>
              osis
            </p>
          </div>

          <div className="mb-6 seg" role="group" aria-label="Pilih mode">
            <button type="button" aria-pressed={tab === "login"} onClick={() => switchTab("login")}>
              Masuk
            </button>
            <button type="button" aria-pressed={tab === "daftar"} onClick={() => switchTab("daftar")}>
              Daftar
            </button>
          </div>

          <h2 className="font-display text-fg text-2xl" style={{ fontWeight: 900 }}>
            {tab === "login" ? "Selamat datang kembali!" : "Buat akunmu"}
          </h2>
          <p className="mt-1 font-semibold text-fg-3 text-sm leading-relaxed">
            {tab === "login"
              ? "Masuk dengan email dan kata sandimu."
              : "Santri pakai email sekolah. Admin harus memakai email yang sudah didaftarkan Super Admin."}
          </p>

          {needVerify && (
            <div className="flex gap-2.5 bg-sky-50 mt-5 p-3.5 border-2 border-sky-200 rounded-2xl font-semibold text-sky-800 text-xs">
              <MailCheck size={16} className="mt-0.5 shrink-0" />
              <span>
                Akun dibuat! Verifikasi email dulu lewat tautan yang dikirim, lalu masuk kembali.
              </span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4 mt-5" noValidate>
            {formError && (
              <p className="bg-rose-50 px-3.5 py-2.5 border-2 border-rose-200 rounded-2xl font-bold text-rose-700 text-xs">
                {formError}
              </p>
            )}
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@student.abudzar.sch.id"
                autoComplete="email"
              />
            </Field>
            <Field label="Kata sandi" required error={errors.password}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading}>
              {tab === "login" ? "Masuk" : "Daftar"}
            </Button>

            <div className="flex items-center gap-3 text-fg-4">
              <span className="flex-1 bg-line h-0.5" />
              <span className="font-extrabold text-[11px] uppercase tracking-widest">atau</span>
              <span className="flex-1 bg-line h-0.5" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon={Eye}
              onClick={() => {
                enterGuest();
                navigate(entryPath("guest"));
              }}>
              Lihat sebagai tamu
            </Button>
          </form>

          <p className="mt-5 font-semibold text-[11px] text-fg-3 text-center leading-relaxed">
            Mode tamu hanya menampilkan jadwal & liga — tanpa data pribadi.
          </p>

          {canInstall && (
            <button
              onClick={install}
              className="flex justify-center items-center gap-2 mt-4 py-2 w-full font-extrabold text-brand-dim text-xs">
              <Download size={14} strokeWidth={2.6} /> Pasang di layar utama
            </button>
          )}
          {iosHint && (
            <p className="mt-4 font-semibold text-[11px] text-fg-3 text-center">
              Di iPhone: ketuk <b>Bagikan</b> lalu <b>Tambah ke Layar Utama</b> agar terasa seperti aplikasi.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
