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
    const handle = async (s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) await loadProfile(s.user.id);
      else setProfile(null);
      setBooting(false);
    };
    supabase.auth.getSession().then(({ data }) => handle(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => handle(s));
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return loadProfile(data.user.id); // null → santri belum memilih nama
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session)
      return { verified: true, profile: await loadProfile(data.user.id) };
    return { verified: false, profile: null }; // verifikasi email aktif di Supabase
  }, []);

  // Klaim profil — verifikasi identitas dilakukan di DATABASE (RPC).
  const claimProfile = useCallback(async (profileId) => {
    const { error } = await supabase.rpc("claim_santri_profile", {
      p_profile_id: profileId,
    });
    if (error) throw error;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return loadProfile(user.id);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(
    () =>
      session?.user ? loadProfile(session.user.id) : Promise.resolve(null),
    [session, loadProfile],
  );

  return (
    <AuthCtx.Provider
      value={{
        session,
        profile,
        booting,
        signIn,
        signUp,
        signOut,
        claimProfile,
        refreshProfile,
        role: profile?.role ?? null,
      }}>
      {children}
    </AuthCtx.Provider>
  );
}
