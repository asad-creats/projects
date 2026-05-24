import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

export const Login = ({ auth }) => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setError(e.message || 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithPassword(email, password);
        if (err) throw err;
      } else {
        const { data, error: err } = await auth.signUpWithPassword(email, password);
        if (err) throw err;
        if (!data.session) {
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        }
      }
    } catch (e2) {
      setError(e2.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.title}>✨ AI Task Manager</h1>
        <p style={s.subtitle}>Sign in to manage your tasks with AI</p>

        {!auth.isConfigured && (
          <div style={s.warn}>
            Authentication isn't configured yet. Set REACT_APP_SUPABASE_URL and
            REACT_APP_SUPABASE_ANON_KEY to enable sign-in.
          </div>
        )}

        <button style={s.googleBtn} onClick={handleGoogle} disabled={!auth.isConfigured}>
          <span style={{ fontSize: '1.1rem' }}>🇬</span> Continue with Google
        </button>

        <div style={s.divider}><span style={s.dividerText}>or</span></div>

        <form onSubmit={handleSubmit} style={s.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={s.input}
            autoComplete="email"
            disabled={!auth.isConfigured}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={s.input}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            disabled={!auth.isConfigured}
          />

          {error && <div style={s.error}>{error}</div>}
          {info && <div style={s.info}>{info}</div>}

          <button type="submit" style={s.submitBtn} disabled={loading || !auth.isConfigured}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={s.switchRow}>
          {mode === 'signin' ? (
            <>No account?{' '}
              <button style={s.linkBtn} onClick={() => { setMode('signup'); setError(''); }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button style={s.linkBtn} onClick={() => { setMode('signin'); setError(''); }}>
                Sign in
              </button>
            </>
          )}
        </div>

        <Link to="/" style={s.backLink}>← Back to Home</Link>
      </div>
    </div>
  );
};

const s = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: `radial-gradient(1000px 500px at 50% -10%, rgba(56,189,248,0.12), transparent 60%), ${theme.bg}`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    background: theme.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '0.5rem 0 1.5rem',
  },
  warn: {
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.3)',
    color: theme.warning,
    fontSize: '0.8rem',
    padding: '0.75rem',
    borderRadius: '10px',
    marginBottom: '1rem',
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    textAlign: 'center',
    margin: '1.25rem 0',
    color: theme.textMuted,
    fontSize: '0.75rem',
  },
  dividerText: {
    margin: '0 auto',
    background: theme.surface,
    padding: '0 0.75rem',
    position: 'relative',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: {
    padding: '0.75rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  error: {
    color: theme.danger,
    fontSize: '0.8rem',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
  },
  info: {
    color: theme.success,
    fontSize: '0.8rem',
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
  },
  submitBtn: {
    padding: '0.8rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '0.25rem',
  },
  switchRow: {
    textAlign: 'center',
    fontSize: '0.8rem',
    color: theme.textMuted,
    marginTop: '1.25rem',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: theme.accent,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: 0,
    fontFamily: 'inherit',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: '0.8rem',
    textDecoration: 'none',
    marginTop: '1rem',
  },
};
