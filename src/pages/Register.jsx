import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = {
    length: password.length >= 6,
    match: confirmPassword && password === confirmPassword,
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setError('');
    setLoading(true);
    try {
      const data = await signup(email, password);
      if (data.session) {
        navigate('/role-selection');
      } else {
        // Email confirmation is enabled — user must verify before signing in.
        setError('Account created! Check your email to confirm, then sign in.');
      }
    } catch (err) {
      const msg = (err && err.message) || '';
      setError(msg.includes('already registered') ? 'An account with this email already exists' : 'Failed to create account');
    }
    setLoading(false);
  }

  return (
    <div className="auth-page bg-surface">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-on-primary text-[28px]">health_and_safety</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">CareConnect</h1>
        </div>

        <div className="auth-card p-6">
          <h2 className="text-2xl font-bold text-on-surface mb-1">Create Account</h2>
          <p className="text-sm text-on-surface-variant mb-6">Join CareConnect today</p>

          {error && (
            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl mb-4 text-sm font-medium animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="auth-input" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="auth-input pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline p-1">
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              {password && (
                <div className={`flex items-center gap-1.5 text-xs mt-1 ${passwordChecks.length ? 'text-health' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[14px]">{passwordChecks.length ? 'check_circle' : 'radio_button_unchecked'}</span>
                  At least 6 characters
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="auth-input" required />
              {confirmPassword && (
                <div className={`flex items-center gap-1.5 text-xs mt-1 ${passwordChecks.match ? 'text-health' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-[14px]">{passwordChecks.match ? 'check_circle' : 'cancel'}</span>
                  {passwordChecks.match ? 'Passwords match' : 'Passwords do not match'}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="auth-button mt-1">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
