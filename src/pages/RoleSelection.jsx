import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { currentUser, setRole, updateProfile } = useAuth();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleSelectRole(role) {
    setSelectedRole(role);
  }

  async function handleConfirm() {
    const role = selectedRole;
    setSaving(true);

    // Local-first: set the role and navigate immediately.
    // The app must NEVER block on Supabase here — a denied write or a slow
    // network previously left users stuck on this page with no feedback.
    setRole(role);
    navigate(role === 'parent' ? '/parent' : '/caregiver');

    // Best-effort persistence to Supabase (non-blocking).
    if (currentUser) {
      try {
        await updateProfile({ role, email: currentUser.email });
      } catch (e) {
        console.error('Failed to persist role to Supabase:', e);
        toast.error('Role saved on this device — will sync when connected');
      }
    }
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

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-on-surface mb-1">Who are you?</h2>
          <p className="text-sm text-on-surface-variant">Select your role to get started</p>
        </div>

        <div className="flex flex-col gap-3">
          {!selectedRole ? (
            <>
              <button
                onClick={() => handleSelectRole('parent')}
                className="auth-card w-full p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[24px]">family_restroom</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-on-surface">Parent / Guardian</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Monitor activity, view reports, track visits</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0">chevron_right</span>
              </button>

              <button
                onClick={() => handleSelectRole('caregiver')}
                className="auth-card w-full p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-secondary text-[24px]">volunteer_activism</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-on-surface">Caregiver</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">Log activities, manage tasks, send alerts</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0">chevron_right</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="auth-button bg-primary text-on-primary"
              >
                {saving ? 'Setting up...' : selectedRole === 'parent' ? 'Continue as Parent' : 'Continue as Caregiver'}
              </button>
              <button
                onClick={() => setSelectedRole(null)}
                className="auth-button bg-surface-container-low text-on-surface-variant"
              >
                Back
              </button>
            </>
          )}
        </div>

        {selectedRole === 'caregiver' && (
          <p className="text-center text-[11px] text-outline mt-6">
            After setup, connect to a family from your dashboard using the parent's email &amp; child's name.
          </p>
        )}

        <p className="text-center text-[11px] text-outline mt-8">
          Works offline — data syncs when connected
        </p>
      </div>
    </div>
  );
}
