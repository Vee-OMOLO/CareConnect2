import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/firestoreService';
import { notifyParent } from '../services/notificationService';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import ActivityChip from '../components/ActivityChip';
import { activityColors, activityTypes } from '../constants/activityData';

export default function LogActivity() {
  const navigate = useNavigate();
  const { linkKey, currentUser } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'feeding';

  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedOption, setSelectedOption] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const currentType = activityTypes.find(a => a.type === selectedType);
  const showQuantity = selectedType === 'feeding' || selectedType === 'medicine';

  // No linked family yet — prompt instead of writing to a null path
  if (!linkKey) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Log Activity" onBack />
        <div className="card p-8 flex flex-col items-center text-center animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-outline text-[28px]">family_restroom</span>
          </div>
          <h3 className="text-base font-bold text-on-surface mb-1">Link a family first</h3>
          <p className="text-sm text-on-surface-variant max-w-[260px]">Connect to a parent &amp; child before logging activities.</p>
          <button
            onClick={() => navigate('/caregiver/link')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold card-interactive"
          >
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">link</span>
              Link Now
            </span>
          </button>
        </div>
      </div>
    );
  }

  async function handleSave() {
    if (!linkKey) {
      setError('No child profile found. Please complete setup.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await logActivity(linkKey, {
        activityType: selectedType,
        details: {
          option: selectedOption,
          quantity: showQuantity ? quantity : undefined,
          notes: notes || undefined,
        },
        caregiverId: currentUser?.uid || 'unknown',
        caregiverEmail: currentUser?.email || 'unknown',
      });
      if (result) {
        setSaved(true);
        toast.success('Activity logged successfully!');
        // Notify the linked parent (best-effort, non-blocking)
        notifyParent(linkKey, selectedType, {
          option: selectedOption,
          quantity: showQuantity ? quantity : undefined,
          notes: notes || undefined,
        }).catch(() => {});
        setTimeout(() => navigate('/caregiver'), 1000);
      } else {
        setError('Failed to save. Will retry when online.');
        toast.error('Saved offline — will sync when connected');
        setSaving(false);
      }
    } catch (e) {
      console.error('Failed to log activity:', e);
      setError('An error occurred. Please try again.');
      toast.error('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-center animate-scale-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: activityColors[selectedType]?.bg || '#edeeef' }}>
            <span className="material-symbols-outlined text-[36px]" style={{ color: activityColors[selectedType]?.text || '#44474c' }}>check</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface">Logged!</h2>
          <p className="text-sm text-on-surface-variant mt-1">{currentType?.label} activity saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Log Activity" onBack />

      {error && (
        <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium animate-shake">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </div>
      )}

      {/* Activity Type */}
      <div className="animate-fade-in-up">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">What did you do?</h2>
        <div className="grid grid-cols-3 gap-2">
          {activityTypes.map((a) => (
            <ActivityChip
              key={a.type}
              type={a.type}
              selected={selectedType === a.type}
              onClick={() => { setSelectedType(a.type); setSelectedOption(''); }}
              size="lg"
            />
          ))}
        </div>
      </div>

      {/* Sub-options */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Details</h2>
        <div className="card p-3">
          <div className="grid grid-cols-2 gap-2">
            {currentType?.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedOption(opt)}
                className={`py-3 px-3 rounded-xl text-sm font-medium text-center leading-snug transition-all duration-150 ${
                  selectedOption === opt
                    ? ''
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
                style={selectedOption === opt ? { backgroundColor: activityColors[selectedType]?.bg || '#edeeef', color: activityColors[selectedType]?.text || '#44474c' } : undefined}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quantity */}
      {showQuantity && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Amount</h2>
          <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 4 oz" className="glass-input" />
        </div>
      )}

      {/* Notes */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Notes <span className="font-normal text-outline">(optional)</span></h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any notes..." rows={3} className="glass-input resize-none" />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={!selectedOption || saving}
        className="w-full py-3 rounded-xl font-semibold text-on-primary transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: selectedType ? `var(--color-${selectedType})` : '#041627' }}
      >
        {saving ? 'Saving...' : 'Save Log'}
      </button>
    </div>
  );
}
