import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import EmergencyDashboard from '../components/EmergencyDashboard';
import { activityColors } from '../constants/activityData';
import { saveEmergencyContacts } from '../services/supabaseService';

const defaultContacts = [
  { name: 'Dr. Sarah Smith', role: 'Primary Care Physician', phone: '(555) 123-4567', isPrimary: true },
  { name: 'Robert (Son)', role: 'Family Contact', phone: '(555) 234-5678', isPrimary: false },
  { name: '911 Emergency', role: 'Emergency Services', phone: '911', isPrimary: false },
];

const medicalInfo = [
  { label: 'Blood Type', value: 'O+', icon: 'bloodtype' },
  { label: 'Allergies', value: 'Penicillin, Sulfa drugs', icon: 'warning' },
  { label: 'Conditions', value: 'Hypertension, Type 2 Diabetes', icon: 'medical_information' },
  { label: 'Medications', value: 'Lisinopril 10mg, Metformin 500mg', icon: 'medication' },
];

function AddContactModal({ newContact, setNewContact, onSave, onClose }) {
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Add Contact">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up shadow-lg">
        <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-bold text-on-surface mb-4">Add Contact</h2>
        <div className="flex flex-col gap-3">
          <input ref={firstInputRef} value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Contact name" className="glass-input" />
          <input value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} placeholder="Relationship" className="glass-input" />
          <input type="tel" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone number" className="glass-input" />
          <button onClick={onSave} disabled={!newContact.name || !newContact.phone} className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold text-base disabled:opacity-40">Save Contact</button>
        </div>
      </div>
    </div>
  );
}

export default function SafetyVault() {
  const { linkKey, currentUser } = useAuth();
  const toast = useToast();
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [contacts, setContacts] = useState(defaultContacts);
  const [newContact, setNewContact] = useState({ name: '', role: '', phone: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const primaryContact = contacts.find(c => c.isPrimary);

function saveContactsOffline(data) {
  try { localStorage.setItem('careconnect-emergency-contacts', JSON.stringify(data)); } catch { /* silent */ }
}

function loadContactsOffline() {
  try { const saved = localStorage.getItem('careconnect-emergency-contacts'); if (saved) return JSON.parse(saved); } catch { /* silent */ }
  return defaultContacts;
}

  useEffect(() => {
    setContacts(loadContactsOffline());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  async function addContact() {
    if (!newContact.name || !newContact.phone) return;
    const contact = { ...newContact, isPrimary: false, id: Date.now().toString() };
    const updated = [...contacts, contact];
    setContacts(updated);
    saveContactsOffline(updated);
    if (isOnline) {
      try {
        // linkKey comes from AuthContext (set when a family link is created)
        if (linkKey) await saveEmergencyContacts(linkKey, [contact]);
      } catch { /* silent */ }
    }
    setNewContact({ name: '', role: '', phone: '' });
    setShowAddContact(false);
    toast.success('Contact added');
  }

  function removeContact(index) {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
    saveContactsOffline(updated);
    toast.info('Contact removed');
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Safety Vault"
        subtitle="Emergency contacts & medical info"
        onBack
        rightAction={
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${isOnline ? 'bg-health-bg text-health' : 'bg-medicine-bg text-medicine'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        }
      />

      {/* Emergency */}
      <button
        onClick={() => setShowEmergency(true)}
        className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 emergency-glow card-interactive animate-fade-in-up"
      >
        <span className="material-symbols-outlined text-[20px]">emergency</span>
        Emergency Alert
      </button>

      {/* Contacts */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Contacts</h2>
          <button onClick={() => setShowAddContact(true)} className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center card-interactive">
            <span className="material-symbols-outlined text-primary text-[18px]">add</span>
          </button>
        </div>
        <div className="card overflow-hidden">
          <div className="divide-y divide-outline-variant/15">
            {contacts.map((contact, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${contact.isPrimary ? 'bg-medicine-bg' : 'bg-primary-container'}`}>
                  <span className={`material-symbols-outlined ${contact.isPrimary ? 'text-medicine' : 'text-on-primary-container'} text-[18px]`}>person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-on-surface break-words">{contact.name}</p>
                    {contact.isPrimary && <span className="text-[9px] bg-medicine-bg text-medicine px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Primary</span>}
                  </div>
                  <p className="text-xs text-outline mt-0.5">{contact.role}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={`tel:${contact.phone}`} className="w-8 h-8 bg-health-bg rounded-lg flex items-center justify-center card-interactive">
                    <span className="material-symbols-outlined text-health text-[16px]">call</span>
                  </a>
                  {!contact.isPrimary && (
                    <button onClick={() => removeContact(i)} className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center card-interactive">
                      <span className="material-symbols-outlined text-outline text-[16px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medical Info */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Medical Info</h2>
        <div className="card overflow-hidden">
          <div className="divide-y divide-outline-variant/15">
            {medicalInfo.map((info, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-surface-container-low rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{info.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-outline font-medium">{info.label}</p>
                  <p className="text-sm font-semibold text-on-surface">{info.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Documents</h2>
        <div className="flex flex-col gap-2">
          {[
            { name: 'Insurance Card', icon: 'credit_card', type: 'primary' },
            { name: 'Advance Directive', icon: 'description', type: 'play' },
            { name: 'Recent Lab Results', icon: 'lab', type: 'medicine' },
          ].map((doc, i) => (
            <div key={i} className="card px-4 py-3" style={{ borderLeft: `3px solid ${activityColors[doc.type]?.text || '#74777d'}` }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activityColors[doc.type]?.bg || '#edeeef' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: activityColors[doc.type]?.text || '#44474c' }}>{doc.icon}</span>
                </div>
                <span className="text-sm font-semibold text-on-surface flex-1">{doc.name}</span>
                <span className="material-symbols-outlined text-outline text-[18px] flex-shrink-0">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline is now shown via global OfflineBanner */}

      {/* Add Contact Modal */}
      {showAddContact && (
        <AddContactModal
          newContact={newContact}
          setNewContact={setNewContact}
          onSave={addContact}
          onClose={() => setShowAddContact(false)}
        />
      )}

      {/* Emergency Dashboard */}
      {showEmergency && (
        <EmergencyDashboard
          onClose={() => setShowEmergency(false)}
          linkKey={linkKey}
          caregiverId={currentUser?.uid}
          emergencyPhone={primaryContact?.phone}
        />
      )}
    </div>
  );
}
