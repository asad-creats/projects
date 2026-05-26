import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { theme } from '../styles/theme';

const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was your childhood nickname?',
  'What is your favorite movie?',
  'What was the make of your first car?',
];

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

export const Login = ({ auth }) => {
  const [method, setMethod] = useState('username'); // 'username' | 'email'
  const [mode, setMode] = useState('signin');        // 'signin' | 'signup' | 'forgot'

  // Username/password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Email (passwordless OTP)
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState('enter'); // 'enter' | 'code'
  const [code, setCode] = useState('');

  // Forgot-password (username recovery)
  const [forgotStep, setForgotStep] = useState('username'); // 'username' | 'answer'
  const [foundQuestion, setFoundQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMsgs = () => { setError(''); setInfo(''); };

  const switchMode = (m) => {
    clearMsgs();
    setMode(m);
    setForgotStep('username');
    setFoundQuestion('');
  };

  const switchMethod = (m) => {
    clearMsgs();
    setMethod(m);
    setEmailStep('enter');
    setCode('');
  };

  const handleGoogle = async () => {
    clearMsgs();
    try {
      await auth.signInWithGoogle();
    } catch (e) {
      setError(e.message || 'Google sign-in failed');
    }
  };

  // ----- Username sign in / sign up -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithUsername(username, password);
        if (err) throw err;
      } else {
        if (!securityAnswer.trim()) {
          setError('Set a security answer so you can recover your account.');
          setLoading(false);
          return;
        }
        const { error: err } = await auth.signUpWithUsername(
          username, password, securityQuestion, securityAnswer
        );
        if (err) throw err;
      }
    } catch (e2) {
      setError(e2.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // ----- Email OTP -----
  const handleSendCode = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!emailOk(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      const { error: err } = await auth.sendEmailOtp(email);
      if (err) throw err;
      setInfo(`We emailed a 6-digit code and a sign-in link to ${email.trim()}. Enter the code below — or just click the link in the email.`);
      setEmailStep('code');
    } catch (e2) {
      setError(e2.message || 'Could not send the email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    clearMsgs();
    const c = code.replace(/\D/g, '');
    if (c.length < 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true);
    try {
      const { error: err } = await auth.verifyEmailOtp(email, c);
      if (err) throw err;
      // Success → onAuthStateChange mounts the app.
    } catch (e2) {
      setError(e2.message || 'That code is invalid or expired. Try resending.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    clearMsgs();
    setLoading(true);
    try {
      const { error: err } = await auth.sendEmailOtp(email);
      if (err) throw err;
      setInfo('New code sent — check your inbox.');
    } catch (e2) {
      setError(e2.message || 'Could not resend the code.');
    } finally {
      setLoading(false);
    }
  };

  // ----- Forgot password (username) -----
  const handleForgotLookup = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!username.trim()) { setError('Enter your username.'); return; }
    setLoading(true);
    try {
      const q = await auth.getSecurityQuestion(username);
      if (!q) {
        setError('No security question found for that username.');
      } else {
        setFoundQuestion(q);
        setForgotStep('answer');
      }
    } catch (e2) {
      setError(e2.message || 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!resetAnswer.trim() || !newPassword) {
      setError('Enter your answer and a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await auth.resetPasswordWithAnswer(username, resetAnswer, newPassword);
      setInfo('Password reset! Sign in with your new password.');
      setMode('signin');
      setForgotStep('username');
      setPassword('');
      setResetAnswer('');
      setNewPassword('');
    } catch (e2) {
      setError(e2.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const isForgot = mode === 'forgot';
  const heading = isForgot
    ? 'Reset your password'
    : method === 'email'
      ? 'Continue with email'
      : mode === 'signin'
        ? 'Welcome back'
        : 'Create your account';
  const subheading = isForgot
    ? 'Answer your security question to set a new password.'
    : 'Manage your tasks with a built-in AI assistant.';

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.accentBar} />

        <div style={s.brandRow}>
          <div style={s.logoMark}>✨</div>
          <div style={s.brandText}>AI Task Manager</div>
        </div>

        <h1 style={s.title}>{heading}</h1>
        <p style={s.subtitle}>{subheading}</p>

        {!auth.isConfigured && (
          <div style={s.warn}>
            Authentication isn't configured yet. Set REACT_APP_SUPABASE_URL and
            REACT_APP_SUPABASE_ANON_KEY to enable sign-in.
          </div>
        )}

        {/* ---------- Forgot password (username) ---------- */}
        {isForgot ? (
          forgotStep === 'username' ? (
            <form onSubmit={handleForgotLookup} style={s.form}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={s.input}
                autoComplete="username"
                disabled={!auth.isConfigured}
              />
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" style={s.submitBtn} disabled={loading || !auth.isConfigured}>
                {loading ? 'Please wait…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} style={s.form}>
              <div style={s.qLabel}>{foundQuestion}</div>
              <input
                type="text"
                placeholder="Your answer"
                value={resetAnswer}
                onChange={(e) => setResetAnswer(e.target.value)}
                style={s.input}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={s.input}
                autoComplete="new-password"
              />
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" style={s.submitBtn} disabled={loading}>
                {loading ? 'Please wait…' : 'Reset password'}
              </button>
            </form>
          )
        ) : (
          <>
            {/* Method switch */}
            <div style={s.seg} role="tablist" aria-label="Sign-in method">
              <button
                type="button"
                style={{ ...s.segBtn, ...(method === 'username' ? s.segBtnActive : {}) }}
                onClick={() => switchMethod('username')}
              >
                Username
              </button>
              <button
                type="button"
                style={{ ...s.segBtn, ...(method === 'email' ? s.segBtnActive : {}) }}
                onClick={() => switchMethod('email')}
              >
                Email
              </button>
            </div>

            <button style={s.googleBtn} onClick={handleGoogle} disabled={!auth.isConfigured}>
              <span style={s.googleG}>G</span> Continue with Google
            </button>

            <div style={s.divider}>
              <span style={s.dividerLine} />
              <span style={s.dividerText}>or</span>
              <span style={s.dividerLine} />
            </div>

            {/* ---------- Username method ---------- */}
            {method === 'username' && (
              <form onSubmit={handleSubmit} style={s.form}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={s.input}
                  autoComplete="username"
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

                {mode === 'signup' && (
                  <>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      style={s.input}
                      disabled={!auth.isConfigured}
                    >
                      {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Security answer (for password recovery)"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      style={s.input}
                      disabled={!auth.isConfigured}
                    />
                  </>
                )}

                {error && <div style={s.error}>{error}</div>}
                {info && <div style={s.info}>{info}</div>}

                <button type="submit" style={s.submitBtn} disabled={loading || !auth.isConfigured}>
                  {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>

                {mode === 'signin' && (
                  <button type="button" style={{ ...s.linkBtn, alignSelf: 'center', marginTop: '0.25rem' }} onClick={() => switchMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </form>
            )}

            {/* ---------- Email method (passwordless OTP) ---------- */}
            {method === 'email' && (
              emailStep === 'enter' ? (
                <form onSubmit={handleSendCode} style={s.form}>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={s.input}
                    autoComplete="email"
                    disabled={!auth.isConfigured}
                  />
                  {error && <div style={s.error}>{error}</div>}
                  {info && <div style={s.info}>{info}</div>}
                  <button type="submit" style={s.submitBtn} disabled={loading || !auth.isConfigured}>
                    {loading ? 'Sending…' : 'Email me a sign-in code'}
                  </button>
                  <div style={s.hint}>No password needed — your inbox verifies you. New here? An account is created automatically.</div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} style={s.form}>
                  <div style={s.qLabel}>Enter the 6-digit code sent to {email.trim()}</div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    style={s.codeInput}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  {error && <div style={s.error}>{error}</div>}
                  {info && <div style={s.info}>{info}</div>}
                  <button type="submit" style={s.submitBtn} disabled={loading}>
                    {loading ? 'Verifying…' : 'Verify & sign in'}
                  </button>
                  <div style={s.codeFooter}>
                    <button type="button" style={s.linkBtn} onClick={handleResend} disabled={loading}>
                      Resend code
                    </button>
                    <button type="button" style={s.linkBtn} onClick={() => { clearMsgs(); setEmailStep('enter'); setCode(''); }}>
                      Use a different email
                    </button>
                  </div>
                </form>
              )
            )}
          </>
        )}

        {/* ---------- Footer switch row ---------- */}
        <div style={s.switchRow}>
          {!isForgot && method === 'username' && mode === 'signin' && (
            <>No account?{' '}
              <button style={s.linkBtn} onClick={() => switchMode('signup')}>Create one</button>
            </>
          )}
          {!isForgot && method === 'username' && mode === 'signup' && (
            <>Already have an account?{' '}
              <button style={s.linkBtn} onClick={() => switchMode('signin')}>Sign in</button>
            </>
          )}
          {!isForgot && method === 'email' && (
            <span style={{ color: theme.textMuted }}>Sign in and sign up are the same with email.</span>
          )}
          {isForgot && (
            <button style={s.linkBtn} onClick={() => switchMode('signin')}>← Back to sign in</button>
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
    background: `radial-gradient(1100px 560px at 50% -12%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(800px 500px at 100% 110%, rgba(99,102,241,0.12), transparent 55%), ${theme.bg}`,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    background: `linear-gradient(180deg, ${theme.surfaceElevated}, ${theme.surface})`,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusLg,
    padding: '2.25rem 2rem 1.75rem',
    boxShadow: theme.shadowLg,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: theme.gradient,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    marginBottom: '1.25rem',
  },
  logoMark: {
    width: '38px',
    height: '38px',
    borderRadius: '11px',
    background: theme.gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.15rem',
    boxShadow: '0 6px 18px rgba(56,189,248,0.35)',
  },
  brandText: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: theme.text,
    letterSpacing: '-0.01em',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: theme.text,
    margin: 0,
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '0.4rem 0 1.4rem',
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
  seg: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.25rem',
    padding: '0.25rem',
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    marginBottom: '1rem',
  },
  segBtn: {
    padding: '0.55rem',
    background: 'transparent',
    border: 'none',
    borderRadius: '9px',
    color: theme.textSecondary,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  segBtnActive: {
    background: theme.glass,
    color: theme.accent,
    boxShadow: `inset 0 0 0 1px ${theme.glassBorder}`,
  },
  googleBtn: {
    width: '100%',
    padding: '0.75rem',
    background: theme.bg,
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    fontFamily: 'inherit',
  },
  googleG: {
    fontWeight: 800,
    fontSize: '1rem',
    color: '#4285F4',
    fontFamily: 'Arial, sans-serif',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '1.1rem 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: theme.border,
  },
  dividerText: {
    color: theme.textMuted,
    fontSize: '0.75rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  qLabel: {
    color: theme.text,
    fontSize: '0.875rem',
    fontWeight: 600,
    padding: '0.25rem 0',
    lineHeight: 1.4,
  },
  input: {
    padding: '0.8rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  codeInput: {
    padding: '0.85rem 1rem',
    background: theme.bg,
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '1.6rem',
    fontWeight: 700,
    letterSpacing: '0.5em',
    textAlign: 'center',
    fontFamily: 'inherit',
    outline: 'none',
  },
  error: {
    color: theme.danger,
    fontSize: '0.8rem',
    background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
  },
  info: {
    color: theme.success,
    fontSize: '0.8rem',
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
    lineHeight: 1.4,
  },
  hint: {
    color: theme.textMuted,
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  submitBtn: {
    padding: '0.85rem',
    background: theme.gradient,
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    marginTop: '0.25rem',
    boxShadow: '0 8px 22px rgba(56,189,248,0.28)',
  },
  codeFooter: {
    display: 'flex',
    justifyContent: 'space-between',
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
