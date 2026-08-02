import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';

export default function LinkFamily() {
  const navigate = useNavigate();
  const { currentUser, childName, parentEmail, setChild, setParentEmail, updateProfile } = useAuth();
  const toast = useToast();
  const [childNameInput, setChildNameInput] = useState(childName || '');
  const [parentEmailInput, setParentEmailInput] = useState(parentEmail || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isLinked = Boolean(parentEmail && childName);

  async function handleSave() {
    const name = childNameInput.trim();
    const email = parentEmailInput.trim().toLowerCase();

    if (!name) return setError("Please enter the child's name");
    if (!email) return setError("Please enter the parent's email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address');

    setError('');
    setSaving(true);
    // Local-first: save to localStorage/context immediately and navigate.
    // Firestore persistence is best-effort so a denied write never blocks setup.
    setParentEmail(email);
    setChild(name);
    if (currentUser) {
      try {
        await updateProfile({ parentEmail: email, childName: name });
      } catch (e) {
        console.error('Failed to persist family link:', e);
      }
    }
    toast.success(isLinked ? 'Family link updated!' : 'Family linked successfully!');
    navigate('/caregiver');
  }

  async function handleRemove() {
    if (!window.confirm('Remove the link to this family? You will no longer share activity logs with this parent.')) return;
    setSaving(true);
    setError('');
    setParentEmail('');
    setChild('');
    if (currentUser) {
      try {
        await updateProfile({ parentEmail: '', childName: '' });
      } catch (e) {
        console.error('Failed to remove family link from Firestore:', e);
      }
    }
    toast.info('Family link removed');
    navigate('/caregiver');
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Link Family" subtitle="Connect with a parent & child" onBack />

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium animate-shake">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* Current status */}
      {isLinked ? (
        <div className="card p-4 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-health-bg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-health text-[20px]">family_restroom</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-on-surface-variant">Connected Family</p>
              <p className="text-sm font-semibold text-on-surface break-words">
                {childName} <span className="font-normal text-on-surface-variant">· {parentEmail}</span>
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-health">check_circle</span>
          </div>
        </div>
      ) : (
        <div className="card p-8 flex flex-col items-center text-center animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-outline text-[28px]">link</span>
          </div>
          <h3 className="text-base font-bold text-on-surface mb-1">Not linked yet</h3>
          <p className="text-sm text-on-surface-variant max-w-[260px]">
            Enter the parent's email and the child's name below to start sharing activity logs.
          </p>
        </div>
      )}

      {/* Link form */}
      <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Family Details</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Parent's Email</label>
            <input
              type="email"
              value={parentEmailInput}
              onChange={(e) => setParentEmailInput(e.target.value)}
              placeholder="parent@example.com"
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Child's Name</label>
            <input
              value={childNameInput}
              onChange={(e) => setChildNameInput(e.target.value)}
              placeholder="e.g. Olivia"
              className="glass-input"
            />
          </div>
          <p className="text-[11px] text-outline leading-relaxed flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[14px] flex-shrink-0">info</span>
            <span>
              Your activity logs will be shared instantly with this parent, and they'll see live updates for{' '}
              {childNameInput.trim() || 'your child'}.
            </span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="auth-button bg-primary text-on-primary"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">link</span>
              {isLinked ? 'Update Link' : 'Link Family'}
            </>
          )}
        </button>
        {isLinked && (
          <button
            onClick={handleRemove}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-sm text-secondary bg-secondary/10 card-interactive disabled:opacity-50"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">link_off</span>
              Remove Link
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
