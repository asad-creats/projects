import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

// Usernames are mapped to a synthetic internal email so Supabase's email-based
// Auth can store the credential. No mail is ever sent to these addresses
// (email confirmation must be disabled in the Supabase dashboard).
const USERNAME_DOMAIN = 'taskuser.app';

export const normalizeUsername = (u) => String(u || '').trim().toLowerCase();
export const usernameToEmail = (u) => `${normalizeUsername(u)}@${USERNAME_DOMAIN}`;
export const isValidUsername = (u) => /^[a-z0-9._-]{3,30}$/.test(normalizeUsername(u));

// SHA-256 hex of the normalized answer. MUST match the Edge Function's hashing
// (trim + lowercase) so signup and reset produce the same digest.
async function hashAnswer(answer) {
  const normalized = String(answer).trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

  // --- Username-based auth (no email) ------------------------------------

  const signInWithUsername = async (username, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!isValidUsername(username)) {
      return { error: { message: 'Enter a valid username (3-30 chars: letters, numbers, . _ -).' } };
    }
    return supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
  };

  const signUpWithUsername = async (username, password, securityQuestion, securityAnswer) => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!isValidUsername(username)) {
      return { error: { message: 'Username must be 3-30 chars: letters, numbers, . _ - only.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username: normalizeUsername(username) } },
    });
    if (error) return { error };

    // No session means email confirmation is still ON — surface a clear hint.
    if (!data.session) {
      return {
        error: {
          message:
            'Sign-up succeeded but the account needs confirmation. Disable "Confirm email" in Supabase Auth settings to use username login.',
        },
      };
    }

    // Store username + hashed security answer in the profile row.
    const answerHash = securityAnswer ? await hashAnswer(securityAnswer) : null;
    const { error: pErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: normalizeUsername(username),
      security_question: securityQuestion || null,
      security_answer_hash: answerHash,
    });
    if (pErr) {
      // Username collision shows up here (unique constraint).
      const msg = /duplicate|unique/i.test(pErr.message)
        ? 'That username is taken. Try another.'
        : pErr.message;
      return { error: { message: msg } };
    }

    return { data };
  };

  // Forgot-password: fetch the user's security question (logged out).
  const getSecurityQuestion = async (username) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.rpc('get_security_question', {
      p_username: normalizeUsername(username),
    });
    if (error) throw error;
    return data; // question text, or null if not found
  };

  // Forgot-password: verify the answer and set a new password via the function.
  const resetPasswordWithAnswer = async (username, answer, newPassword) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.functions.invoke('reset-password', {
      body: { username: normalizeUsername(username), answer, newPassword },
    });
    if (error) {
      // Edge function returns a JSON {error} body on 4xx.
      const ctx = await error.context?.json?.().catch(() => null);
      throw new Error(ctx?.error || error.message || 'Reset failed');
    }
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    return supabase.auth.signOut();
  };

  const user = session?.user ?? null;

  return {
    session,
    user,
    displayName: user?.user_metadata?.username || user?.email || '',
    authReady,
    isConfigured: !!supabase,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signInWithUsername,
    signUpWithUsername,
    getSecurityQuestion,
    resetPasswordWithAnswer,
    signOut,
  };
};
