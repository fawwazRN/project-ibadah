import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    setProfile(data ?? null);
    return data ?? null;
  }, []);

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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
      else setProfile(null);
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
    return loadProfile(data.user.id);
  }, []);

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
        role: profile?.role ?? null,
      }}>
      {children}
    </AuthCtx.Provider>
  );
}
