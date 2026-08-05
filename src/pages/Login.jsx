import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function loginErrorMessage(err) {
  const code = err?.code || err?.status || '';
  const msg = (err && err.message) || '';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return 'Please confirm your email first — check your inbox for the verification link.';
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
    return 'Invalid email or password.';
  }
  if (/user not found/i.test(msg) || /no account/i.test(msg)) {
    return 'No account found with this email. Get started to create one.';
  }
  if (/too many requests/i.test(msg)) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return 'Unable to sign in. Please try again.';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login, sendPasswordReset, userRole } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Role is loaded from the profile asynchronously; if we already know it,
      // skip the role-selection screen and go straight to the right dashboard.
      navigate(userRole ? (userRole === 'parent' ? '/parent' : '/caregiver') : '/role-selection');
    } catch (err) {
      setError(loginErrorMessage(err));
    }
    setLoading(false);
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await sendPasswordReset(email);
      setForgotSent(true);
    } catch (err) {
      setForgotError((err && err.message) || 'Unable to send reset link.');
    }
    setForgotLoading(false);
  }

  return (
    <div className="auth-page bg-surface">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-on-primary text-[28px]">health_and_safety</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">CareConnect</h1>
          <p className="text-sm text-on-surface-variant mt-1">Real-time care coordination</p>
        </div>

        <div className="auth-card p-6">
          <h2 className="text-2xl font-bold text-on-surface mb-1">Welcome back</h2>
          <p className="text-sm text-on-surface-variant mb-6">Sign in to continue</p>

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4 text-sm font-medium animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="auth-input"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="auth-input pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => { setShowForgot(true); setForgotSent(false); setForgotError(''); }} className="text-xs font-semibold text-primary">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="auth-button">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold">Get started</Link>
        </p>
      </div>

      {showForgot && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 animate-slide-up">
            {forgotSent ? (
              <>
                <div className="w-12 h-12 bg-health/10 rounded-2xl flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-health text-[24px]">mark_email_read</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">Reset link sent</h3>
                <p className="text-sm text-on-surface-variant mt-1 mb-5">
                  If an account exists for <span className="font-semibold text-on-surface">{email}</span>, a password reset link is on its way. Check your inbox (and spam).
                </p>
                <button onClick={() => setShowForgot(false)} className="auth-button">Done</button>
              </>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[24px]">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Reset your password</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Enter your email and we'll send you a reset link.</p>
                </div>

                {forgotError && (
                  <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {forgotError}
                  </div>
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="auth-input"
                  required
                />

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForgot(false)} className="flex-1 auth-social-button">Cancel</button>
                  <button type="submit" disabled={forgotLoading} className="flex-1 auth-button">
                    {forgotLoading ? 'Sending...' : 'Send link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
