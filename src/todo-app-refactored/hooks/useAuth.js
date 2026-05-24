import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

/**
 * useAuth - wraps Supabase Auth.
 * Exposes the current session/user plus sign-in/up/out helpers.
 * If Supabase isn't configured, `authReady` still resolves so the UI
 * can show a "not configured" message instead of hanging.
 */
export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/todo` },
    });
  };

  const signInWithPassword = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithPassword = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    return supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/todo` },
    });
  };

  const signOut = async () => {
    if (!supabase) return;
    return supabase.auth.signOut();
  };

  return {
    session,
    user: session?.user ?? null,
    authReady,
    isConfigured: !!supabase,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
};
