import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = memuat · null = belum klaim · object = siap
  const [booting, setBooting] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [profileError, setProfileError] = useState(false); // gagal memuat (jaringan) ≠ belum klaim
  const profileRef = useRef(undefined);
  profileRef.current = profile;

  const loadProfile = useCallback(async (uid) => {
    // Akun yang sudah didaftarkan Super Admin di admin_emails tidak perlu
    // melewati wizard klaim santri. RPC ini hanya membuat/menghubungkan profil
    // jika email pengguna memang terdaftar sebagai admin di database.
    try {
      await supabase.rpc("ensure_admin_profile");
    } catch (e) {
      console.error("Pengecekan profil admin gagal:", e);
    }

    // Coba beberapa kali. Gagal muat (jaringan/gangguan sementara) TIDAK boleh dianggap
    // "belum punya profil" — kalau tidak, admin/santri yang sudah klaim malah dilempar ke
    // halaman pilih kelas.
    let data = null;
    let error = null;
    for (let i = 0; i < 3; i++) {
      ({ data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle());
      if (!error) break;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
    if (error) {
      console.error("Gagal memuat profil:", error);
      setProfileError(true);
      // pertahankan profil yang sudah ada; jika belum ada tetap "memuat" (undefined)
      return profileRef.current ?? null;
    }
    setProfileError(false);
    setProfile(data ?? null);
    return data ?? null;
  }, []);

  const retryProfile = useCallback(async () => {
    setProfileError(false);
    setProfile(undefined);
    const { data } = await supabase.auth.getUser();
    if (data?.user) await loadProfile(data.user.id);
  }, [loadProfile]);

  useEffect(() => {
    let mounted = true;

    // Guest mode tersimpan di sessionStorage — hilang saat tab ditutup
    if (sessionStorage.getItem("osis.guest") === "1") {
      setIsGuest(true);
      setSession(null);
      setProfile(null);
      setBooting(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setProfile(null);
        setBooting(false);
      } else {
        setSession({ user: data.user });
        await loadProfile(data.user.id);
        if (mounted) setBooting(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Penyegaran token berkala tidak perlu memuat ulang profil
        if (event === "TOKEN_REFRESHED" && profileRef.current) return;
        // Baru masuk: tandai "memuat" agar tidak sempat tampil halaman pilih kelas
        if (event === "SIGNED_IN" && !profileRef.current) setProfile(undefined);
        loadProfile(s.user.id);
      } else setProfile(null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const enterGuest = useCallback(() => {
    sessionStorage.setItem("osis.guest", "1");
    setIsGuest(true);
    setSession(null);
    setProfile(null);
  }, []);

  const exitGuest = useCallback(() => {
    sessionStorage.removeItem("osis.guest");
    setIsGuest(false);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    sessionStorage.removeItem("osis.guest");
    setIsGuest(false);
    setProfile(undefined);
    return loadProfile(data.user.id);
  }, [loadProfile]);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session) {
      sessionStorage.removeItem("osis.guest");
      setIsGuest(false);
      return { verified: true, profile: await loadProfile(data.user.id) };
    }
    return { verified: false, profile: null };
  }, []);

  const claimProfile = useCallback(async (profileId) => {
    const { error } = await supabase.rpc("claim_santri_profile", {
      p_profile_id: profileId,
    });
    if (error) throw error;
    const {
      data: { user },
      error: uErr,
    } = await supabase.auth.getUser();
    if (uErr || !user)
      throw new Error("Sesi tidak valid. Silakan keluar lalu masuk ulang.");
    return loadProfile(user.id);
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem("osis.guest");
    setIsGuest(false);
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        session,
        profile,
        booting,
        isGuest,
        enterGuest,
        exitGuest,
        signIn,
        signUp,
        signOut,
        claimProfile,
        profileError,
        retryProfile,
        role: profile?.role ?? null,
      }}>
      {children}
    </AuthCtx.Provider>
  );
}
