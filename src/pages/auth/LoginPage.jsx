import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, MailCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { BrandMark } from "../../components/ui/BrandMark";
import { homeFor } from "../../routes/AppRoutes";

const EMAIL_DOMAIN = "@student.abudzar.sch.id";

// Email harus domain sekolah, KECUALI yang mengandung 'fawwaz'
const emailAllowed = (email) => {
  const v = email.toLowerCase();
  return v.includes("fawwaz") || v.endsWith(EMAIL_DOMAIN);
};

export default function LoginPage() {
  const { session, profile, booting, signIn, signUp } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("login"); // 'login' | 'daftar'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [needVerify, setNeedVerify] = useState(false);
  const [loading, setLoading] = useState(false);

  if (booting) return null;
  if (session) {
    if (!profile) return <Navigate to="/claim" replace />;
    return <Navigate to={homeFor(profile.role)} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email))
      errs.email = "Masukkan email yang valid.";
    else if (tab === "daftar" && !emailAllowed(email)) {
      errs.email = `Pendaftaran hanya boleh menggunakan email ${EMAIL_DOMAIN.slice(1)}.`;
    }
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
        navigate(p ? homeFor(p.role) : "/claim", { replace: true });
      } else {
        const res = await signUp(email.trim().toLowerCase(), password);
        if (res.verified) {
          push("success", "Akun berhasil dibuat");
          navigate(res.profile ? homeFor(res.profile.role) : "/claim", {
            replace: true,
          });
        } else {
          setNeedVerify(true); // verifikasi email aktif di pengaturan Supabase
        }
      }
    } catch (err) {
      setFormError(err.message ?? "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 bg-ink-950 min-h-screen">
      {/* Panel brand */}
      <div className="hidden relative lg:flex flex-col justify-between bg-ink-900/50 bg-lattice p-10 border-white/[0.06] border-r">
        <div className="flex items-center gap-3">
          <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-11 text-brand-soft">
            <BrandMark className="size-6" />
          </span>
          <div>
            <p className="font-display font-bold text-slate-50 text-base">
              Ibadah OSIS
            </p>
            <p className="font-medium text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              Qism Ibadah · OSIS
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="font-display font-semibold text-slate-50 text-3xl leading-snug">
            Sistem pemantauan &amp; pengelolaan poin ibadah santri.
          </h1>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Masuk dengan email kamu. Santri kemudian memilih kelas dan namanya
            dari daftar resmi sekolah untuk menghubungkan akun.
          </p>
          <p className="mt-4 text-slate-600 text-xs">
            Pendaftaran menggunakan email{" "}
            <span className="font-mono text-slate-500">{EMAIL_DOMAIN}</span>.
          </p>
        </div>
        <p className="text-slate-600 text-xs">
          © {new Date().getFullYear()} OSIS Qism Ibadah · Penggunaan internal
          madrasah
        </p>
      </div>

      {/* Form */}
      <div className="flex justify-center items-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-10 text-brand-soft">
              <BrandMark className="size-5" />
            </span>
            <div>
              <p className="font-display font-bold text-slate-50">
                Ibadah OSIS
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                Qism Ibadah · OSIS
              </p>
            </div>
          </div>

          <div className="gap-1 grid grid-cols-2 bg-white/[0.03] mb-6 p-1 border border-white/10 rounded-xl">
            {[
              ["login", "Masuk"],
              ["daftar", "Daftar"],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k);
                  setFormError("");
                  setNeedVerify(false);
                  setErrors({});
                }}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === k
                    ? "bg-brand/15 text-brand-soft"
                    : "text-slate-400 hover:text-slate-200"
                }`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <>
              <h2 className="font-display font-semibold text-slate-50 text-xl">
                Masuk ke akun kamu
              </h2>
              <p className="mt-1 text-slate-500 text-sm">
                Gunakan email dan kata sandi yang sudah terdaftar.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display font-semibold text-slate-50 text-xl">
                Buat akun baru
              </h2>
              <p className="mt-1 text-slate-500 text-sm">
                Wajib email{" "}
                <span className="font-mono text-slate-400 text-xs">
                  {EMAIL_DOMAIN.slice(1)}
                </span>
                . Setelah mendaftar, kamu akan memilih kelas lalu namamu.
              </p>
            </>
          )}

          {needVerify && (
            <div className="flex gap-2.5 bg-sky-400/[0.06] mt-5 p-3.5 border border-sky-400/20 rounded-xl text-sky-200 text-xs">
              <MailCheck size={15} className="mt-0.5 shrink-0" />
              <span>
                Akun dibuat! Verifikasi email dulu lewat tautan yang dikirim,
                lalu masuk kembali. (Atau matikan “Confirm email” di pengaturan
                Supabase.)
              </span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4 mt-6" noValidate>
            {formError && (
              <p className="bg-rose-500/10 px-3 py-2 border border-rose-400/20 rounded-lg text-rose-300 text-xs">
                {formError}
              </p>
            )}
            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
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
                autoComplete={
                  tab === "login" ? "current-password" : "new-password"
                }
              />
            </Field>
            <Button
              type="submit"
              variant="primary"
              icon={tab === "login" ? LogIn : UserPlus}
              loading={loading}
              className="w-full">
              {tab === "login" ? "Masuk" : "Daftar"}
            </Button>
          </form>

          <p className="mt-6 text-[11px] text-slate-600 text-center leading-relaxed">
            Admin masuk lewat tab yang sama — hak akses ditentukan oleh email
            yang terdaftar di sistem, bukan oleh pilihan di layar.
          </p>
        </div>
      </div>
    </div>
  );
}
