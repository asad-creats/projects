import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [email, setEmail] = useState('');

  const [forgotStep, setForgotStep] = useState('username');
  const [foundQuestion, setFoundQuestion] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMsgs = () => { setError(''); setInfo(''); };
  const switchMode = (m) => { clearMsgs(); setMode(m); setForgotStep('username'); setFoundQuestion(''); };
  const switchMethod = (m) => { clearMsgs(); setMethod(m); setMode('signin'); setForgotStep('username'); };

  const handleGoogle = async () => {
    clearMsgs();
    try { await auth.signInWithGoogle(); }
    catch (e) { setError(e.message || 'Google sign-in failed'); }
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!username.trim() || !password) { setError('Enter your username and password.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithUsername(username, password);
        if (err) throw err;
      } else {
        if (!securityAnswer.trim()) { setError('Set a security answer so you can recover your account.'); setLoading(false); return; }
        const { error: err } = await auth.signUpWithUsername(username, password, securityQuestion, securityAnswer);
        if (err) throw err;
      }
    } catch (e2) { setError(e2.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!emailOk(email)) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    if (mode === 'signup' && password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await auth.signInWithPassword(email.trim(), password);
        if (err) throw err;
      } else {
        const { data, error: err } = await auth.signUpWithPassword(email.trim(), password);
        if (err) throw err;
        if (!data?.session) {
          setInfo('Account created! Check your email for a verification link, then come back and sign in.');
          setMode('signin'); setPassword('');
        }
      }
    } catch (e2) { setError(e2.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const handleEmailReset = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!emailOk(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true);
    try {
      const { error: err } = await auth.resetPasswordForEmail(email);
      if (err) throw err;
      setInfo('If that email has an account, a password reset link is on its way. Check your inbox.');
    } catch (e2) { setError(e2.message || 'Could not send the reset email.'); }
    finally { setLoading(false); }
  };

  const handleForgotLookup = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!username.trim()) { setError('Enter your username.'); return; }
    setLoading(true);
    try {
      const q = await auth.getSecurityQuestion(username);
      if (!q) setError('No security question found for that username.');
      else { setFoundQuestion(q); setForgotStep('answer'); }
    } catch (e2) { setError(e2.message || 'Lookup failed'); }
    finally { setLoading(false); }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMsgs();
    if (!resetAnswer.trim() || !newPassword) { setError('Enter your answer and a new password.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await auth.resetPasswordWithAnswer(username, resetAnswer, newPassword);
      setInfo('Password reset! Sign in with your new password.');
      setMode('signin'); setForgotStep('username'); setPassword(''); setResetAnswer(''); setNewPassword('');
    } catch (e2) { setError(e2.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const isForgot = mode === 'forgot';
  const heading = isForgot ? 'Reset your password' : mode === 'signup' ? 'Create your account' : 'Welcome back';
  const subheading = isForgot
    ? (method === 'username' ? 'Answer your security question to set a new password.' : 'We’ll email you a link to reset your password.')
    : 'Manage your tasks with a built-in AI assistant.';

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-accent" />

        <div className="auth-brand">
          <div className="logo">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5l3 3L13 4.5" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Tally</span>
        </div>

        <h1 className="auth-title">{heading}</h1>
        <p className="auth-sub">{subheading}</p>

        {!auth.isConfigured && (
          <div className="auth-err" style={{ marginBottom: 16 }}>
            Authentication isn't configured yet. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to enable sign-in.
          </div>
        )}

        {isForgot ? (
          method === 'email' ? (
            <form className="auth-form" onSubmit={handleEmailReset}>
              <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={!auth.isConfigured} />
              {error && <div className="auth-err">{error}</div>}
              {info && <div className="auth-info">{info}</div>}
              <button className="auth-submit" type="submit" disabled={loading || !auth.isConfigured}>{loading ? 'Sending…' : 'Send reset link'}</button>
            </form>
          ) : forgotStep === 'username' ? (
            <form className="auth-form" onSubmit={handleForgotLookup}>
              <input className="auth-input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" disabled={!auth.isConfigured} />
              {error && <div className="auth-err">{error}</div>}
              <button className="auth-submit" type="submit" disabled={loading || !auth.isConfigured}>{loading ? 'Please wait…' : 'Continue'}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetSubmit}>
              <div className="auth-q">{foundQuestion}</div>
              <input className="auth-input" type="text" placeholder="Your answer" value={resetAnswer} onChange={(e) => setResetAnswer(e.target.value)} />
              <input className="auth-input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
              {error && <div className="auth-err">{error}</div>}
              <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait…' : 'Reset password'}</button>
            </form>
          )
        ) : (
          <>
            <div className="auth-seg" role="tablist">
              <button type="button" className={method === 'username' ? 'active' : ''} onClick={() => switchMethod('username')}>Username</button>
              <button type="button" className={method === 'email' ? 'active' : ''} onClick={() => switchMethod('email')}>Email</button>
            </div>

            <button className="auth-google" onClick={handleGoogle} disabled={!auth.isConfigured}>
              <span style={{ fontWeight: 800, color: '#4285F4', fontFamily: 'Arial, sans-serif' }}>G</span> Continue with Google
            </button>

            <div className="auth-divider"><span className="ln" />or<span className="ln" /></div>

            {method === 'username' ? (
              <form className="auth-form" onSubmit={handleUsernameSubmit}>
                <input className="auth-input" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" disabled={!auth.isConfigured} />
                <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} disabled={!auth.isConfigured} />
                {mode === 'signup' && (
                  <>
                    <select className="auth-input" value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} disabled={!auth.isConfigured}>
                      {SECURITY_QUESTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                    <input className="auth-input" type="text" placeholder="Security answer (for password recovery)" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} disabled={!auth.isConfigured} />
                  </>
                )}
                {error && <div className="auth-err">{error}</div>}
                {info && <div className="auth-info">{info}</div>}
                <button className="auth-submit" type="submit" disabled={loading || !auth.isConfigured}>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" disabled={!auth.isConfigured} />
                <input className="auth-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} disabled={!auth.isConfigured} />
                {error && <div className="auth-err">{error}</div>}
                {info && <div className="auth-info">{info}</div>}
                <button className="auth-submit" type="submit" disabled={loading || !auth.isConfigured}>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
              </form>
            )}

            {mode === 'signin' && (
              <button type="button" className="auth-link" style={{ display: 'block', margin: '14px auto 0' }} onClick={() => switchMode('forgot')}>Forgot password?</button>
            )}
          </>
        )}

        <div className="auth-foot">
          {!isForgot && mode === 'signin' && (<>No account? <button className="auth-link" onClick={() => switchMode('signup')}>Create one</button></>)}
          {!isForgot && mode === 'signup' && (<>Already have an account? <button className="auth-link" onClick={() => switchMode('signin')}>Sign in</button></>)}
          {isForgot && (<button className="auth-link" onClick={() => switchMode('signin')}>← Back to sign in</button>)}
        </div>

        <Link to="/" className="auth-back">← Back to Home</Link>
      </div>
    </div>
  );
};
