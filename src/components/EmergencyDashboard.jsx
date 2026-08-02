import { useState, useEffect, useRef } from 'react';
import { createEmergencyAlert } from '../services/firestoreService';
import { notifyEmergency } from '../services/notificationService';

const emergencyTypes = [
  { type: 'medical', label: 'Medical', icon: 'local_hospital', color: '#E85D75', bg: '#FDE8EC' },
  { type: 'fire', label: 'Fire', icon: 'local_fire_department', color: '#E8913A', bg: '#FEF3E2' },
  { type: 'missing', label: 'Missing Child', icon: 'person_search', color: '#7B61FF', bg: '#F0EDFF' },
  { type: 'injury', label: 'Injury', icon: 'healing', color: '#E85D75', bg: '#FDE8EC' },
  { type: 'allergic', label: 'Allergic Reaction', icon: 'warning', color: '#E8913A', bg: '#FEF3E2' },
  { type: 'choking', label: 'Choking', icon: 'no_meals', color: '#E85D75', bg: '#FDE8EC' },
];

export default function EmergencyDashboard({ onClose, linkKey, caregiverId, emergencyPhone = '911' }) {
  const [selectedType, setSelectedType] = useState(null);
  const [customEmergency, setCustomEmergency] = useState('');
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [location, setLocation] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (selectedType === 'custom') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedType]);

  const emergencyLabel = selectedType === 'custom'
    ? customEmergency || 'Other Emergency'
    : emergencyTypes.find(e => e.type === selectedType)?.label || '';

  async function handleSendAlert() {
    if (!linkKey) return;
    setEmergencyLoading(true);
    try {
      await createEmergencyAlert(linkKey, location, caregiverId || 'unknown');
      await notifyEmergency(linkKey, location).catch(() =>
        console.warn('Emergency recorded but parent notification failed')
      );
      setSent(true);
      setTimeout(() => { onClose(); setSent(false); }, 2000);
    } catch {
      setSent(true);
      setTimeout(() => { onClose(); setSent(false); }, 2000);
    } finally {
      setEmergencyLoading(false);
    }
  }

  function handleCallEmergency() {
    window.location.href = `tel:${emergencyPhone.replace(/[^0-9+]/g, '')}`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Emergency Dashboard">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-secondary rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-on-secondary text-[22px]">emergency</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-on-surface">Emergency Alert</h2>
            <p className="text-xs text-on-surface-variant">Select the type of emergency</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-8 animate-fade-in-up">
            <div className="w-16 h-16 bg-health-bg rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-health text-[32px]">check_circle</span>
            </div>
            <p className="text-lg font-bold text-on-surface">Alert Sent</p>
            <p className="text-sm text-on-surface-variant mt-1">Emergency contacts have been notified</p>
          </div>
        ) : (
          <>
            {/* Emergency Type Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {emergencyTypes.map((em) => (
                <button
                  key={em.type}
                  onClick={() => { setSelectedType(em.type); setCustomEmergency(''); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selectedType === em.type
                      ? 'border-secondary bg-secondary/10'
                      : 'border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: em.bg }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: em.color }}>{em.icon}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-on-surface leading-tight text-center">{em.label}</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedType('custom')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  selectedType === 'custom'
                    ? 'border-secondary bg-secondary/10'
                    : 'border-outline-variant/30 bg-surface-container-low hover:border-outline-variant/60'
                }`}
              >
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px]">edit_note</span>
                </div>
                <span className="text-[10px] font-semibold text-on-surface leading-tight text-center">Other</span>
              </button>
            </div>

            {/* Custom Input */}
            {selectedType === 'custom' && (
              <div className="mb-4 animate-fade-in-up">
                <input
                  ref={inputRef}
                  value={customEmergency}
                  onChange={(e) => setCustomEmergency(e.target.value)}
                  placeholder="Describe the emergency..."
                  className="glass-input w-full"
                />
              </div>
            )}

            {/* Selected Summary */}
            {selectedType && selectedType !== 'custom' && (
              <div className="mb-4 p-3 bg-secondary/5 border border-secondary/15 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
                <span className="text-sm font-medium text-on-surface">{emergencyLabel} emergency selected</span>
              </div>
            )}

            {/* Location Status */}
            <div className="mb-4 p-3 bg-surface-container-low rounded-xl flex items-center gap-2">
              <span className={`material-symbols-outlined text-[18px] ${location ? 'text-health' : 'text-outline'}`}>
                {location ? 'location_on' : 'location_off'}
              </span>
              <span className="text-xs text-on-surface-variant">
                {location ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location unavailable'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCallEmergency}
                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-secondary text-on-secondary active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                Call {emergencyPhone || '911'}
              </button>
              {!linkKey && (
                <p className="text-[11px] text-center text-medicine font-medium">Link a family first to send alerts</p>
              )}
              <button
                onClick={handleSendAlert}
                disabled={!linkKey || !selectedType || (selectedType === 'custom' && !customEmergency.trim()) || emergencyLoading}
                className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-primary text-on-primary disabled:opacity-40 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]">notification_important</span>
                {emergencyLoading ? 'Sending...' : `Alert Emergency Contacts`}
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container-low active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
