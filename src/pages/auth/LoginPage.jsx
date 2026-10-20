import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Download, Eye, MailCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useShell } from "../../hooks/useShell";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Mascot } from "../../components/ui/Mascot";
import IntroStage from "../../components/auth/IntroStage";
import { entryPath } from "../../routes/AppRoutes";

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
  const [introPaused, setIntroPaused] = useState(false);
  const [focusPass, setFocusPass] = useState(false);
  const [done, setDone] = useState(false);

  if (booting) return null;
  if (session) {
    if (!profile) return <Navigate to="/claim" replace />;
    return <Navigate to={entryPath(profile.role, session.user?.email)} replace />;
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
        setDone(true);
        push("success", "Berhasil masuk");
        navigate(p ? entryPath(p.role, email) : "/claim", { replace: true });
      } else {
        const res = await signUp(email.trim().toLowerCase(), password);
        if (res.verified) {
          push("success", "Akun berhasil dibuat");
          navigate(res.profile ? entryPath(res.profile.role, email) : "/claim", { replace: true });
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
        className="hidden relative lg:block bg-brand w-[46%] overflow-hidden text-on-brand"
        onMouseEnter={() => setIntroPaused(true)}
        onMouseLeave={() => setIntroPaused(false)}
        onFocus={() => setIntroPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIntroPaused(false);
        }}>
        <IntroStage paused={introPaused} />
      </aside>

      {/* Form */}
      <main className="flex flex-1 justify-center items-center p-5 safe-top safe-bottom">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-6 text-center">
            <Mascot mood={done ? "cheer" : loading ? "think" : formError ? "sad" : focusPass ? "peek" : "wave"} size={120} interactive className="animate-float" />
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

          <form onSubmit={submit} className="space-y-4 mt-5 stagger" noValidate key={tab}>
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
                onFocus={() => setFocusPass(true)}
                onBlur={() => setFocusPass(false)}
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
