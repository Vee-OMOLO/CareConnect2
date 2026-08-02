import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import { getAppVersion } from '../utils/updateManager';
import { getAllActivities } from '../services/demoLogger';

export default function Profile() {
  const { currentUser, userRole, logout, linkKey } = useAuth();
  const toast = useToast();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState({ daysActive: '—', logs: '—' });
  const [careTeam, setCareTeam] = useState([
    { name: 'Sarah M.', role: 'Primary Caregiver', initials: 'SM' },
    { name: 'James K.', role: 'Physiotherapist', initials: 'JK' },
    { name: 'Nurse Amy', role: 'Registered Nurse', initials: 'NA' },
  ]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '' });

  const userName = currentUser?.email ? currentUser.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : (userRole === 'parent' ? 'Parent' : 'Caregiver');

  useEffect(() => {
    if (!linkKey) return;
    getAllActivities(linkKey).then((data) => {
      const totalLogs = data.length || 0;
      // Count unique days with activity
      const uniqueDays = new Set(data.map(a => a.created_at ? new Date(a.created_at).toDateString() : null).filter(Boolean)).size;
      setStats({
        daysActive: uniqueDays > 0 ? `${uniqueDays}` : '0',
        logs: totalLogs > 0 ? `${totalLogs}` : '0',
      });
    }).catch(() => {
      setStats({ daysActive: '0', logs: '0' });
    });
  }, [linkKey]);

  const settingsItems = [
    { icon: 'notifications', label: 'Notifications', subtitle: 'Alert preferences' },
    { icon: 'lock', label: 'Privacy & Security', subtitle: 'Password, 2FA' },
    { icon: 'language', label: 'Language', subtitle: 'English' },
    { icon: 'help', label: 'Help & Support', subtitle: 'FAQ, contact' },
    { icon: 'info', label: 'About', subtitle: `v${getAppVersion()}` },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      toast.info('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Profile" onBack />

      {/* Profile Card */}
      <div className="card p-6 text-center animate-fade-in-up">
        <div className="relative w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span className="material-symbols-outlined text-on-primary text-[32px]">person</span>
        </div>
        <h2 className="text-lg font-bold text-on-surface">{userName}</h2>
        <p className="text-sm text-on-surface-variant capitalize mt-0.5">{userRole}</p>
        <p className="text-xs text-outline mt-1">{currentUser?.email}</p>
        <button
          onClick={() => setShowEditProfile(true)}
          className="mt-3 px-5 py-2 rounded-xl bg-surface-container-low text-sm font-semibold text-on-surface card-interactive hover:bg-surface-container transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Profile
          </span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        {[
          { label: 'Days Active', value: stats.daysActive, icon: 'calendar_today' },
          { label: 'Logs', value: stats.logs, icon: 'edit_note' },
        ].map((stat, i) => (
          <div key={i} className="card p-3 text-center">
            <span className="material-symbols-outlined text-[18px] text-outline">{stat.icon}</span>
            <p className="text-xl font-bold text-on-surface mt-1">{stat.value}</p>
            <p className="text-[11px] text-outline mt-0.5 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Care Team */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Care Team</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-outline font-medium">{careTeam.length} members</span>
            <button
              onClick={() => setShowAddMember(true)}
              className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center card-interactive"
              aria-label="Add care team member"
            >
              <span className="material-symbols-outlined text-primary text-[14px]">add</span>
            </button>
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="divide-y divide-outline-variant/15">
            {careTeam.map((member, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{member.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{member.name}</p>
                  <p className="text-xs text-outline">{member.role}</p>
                </div>
                <button
                  onClick={() => {
                    const updated = careTeam.filter((_, idx) => idx !== i);
                    setCareTeam(updated);
                    toast.success('Team member removed');
                  }}
                  className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center card-interactive hover:bg-error-container"
                  aria-label={`Remove ${member.name}`}
                >
                  <span className="material-symbols-outlined text-outline text-[16px]">close</span>
                </button>
                <button className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center card-interactive hover:bg-surface-container transition-colors" aria-label={`Chat with ${member.name}`}>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chat</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Care Team Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-up shadow-lg">
            <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-on-surface mb-4">Add Team Member</h2>
            <div className="flex flex-col gap-3">
              <input
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Full name"
                className="glass-input"
              />
              <input
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                placeholder="Role / Relationship"
                className="glass-input"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-xl font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!newMember.name.trim()) return;
                    const initials = newMember.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    setCareTeam([...careTeam, { name: newMember.name.trim(), role: newMember.role.trim() || 'Care Team Member', initials }]);
                    setShowAddMember(false);
                    setNewMember({ name: '', role: '' });
                    toast.success('Team member added');
                  }}
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Settings</h2>
        <div className="card overflow-hidden">
          <div className="divide-y divide-outline-variant/15">
            {settingsItems.map((item, i) => (
              <button key={i} className="w-full px-4 py-3 flex items-center gap-3 card-interactive hover:bg-surface-container-low transition-colors text-left">
                <div className="w-8 h-8 bg-surface-container-low rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{item.label}</p>
                  <p className="text-xs text-outline">{item.subtitle}</p>
                </div>
                <span className="material-symbols-outlined text-outline text-[18px] flex-shrink-0">chevron_right</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="card py-3 text-secondary font-semibold text-sm flex items-center justify-center gap-2 card-interactive hover:bg-error-container/20 transition-colors animate-fade-in-up disabled:opacity-50"
        style={{ animationDelay: '0.12s' }}
      >
        {loggingOut ? (
          <>
            <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
            Signing out...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </>
        )}
      </button>

      {/* App version */}
      <div className="text-center py-2 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <p className="text-[11px] text-outline">CareConnect v{getAppVersion()}</p>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-label="Edit Profile">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowEditProfile(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up shadow-lg">
            <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-on-surface mb-4">Edit Profile</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Full Name</label>
                <input defaultValue={userName} className="glass-input" placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
                <input defaultValue={currentUser?.email} className="glass-input" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
                <input placeholder="(555) 000-0000" className="glass-input" type="tel" />
              </div>
              <button
                onClick={() => { setShowEditProfile(false); toast.success('Profile updated'); }}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold text-base mt-1 card-interactive"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditProfile(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-on-surface-variant bg-surface-container-low card-interactive"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
