import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllActivities } from '../services/demoLogger';
import { activityColors, activityIcons } from '../constants/activityData';
import { SkeletonTimeline } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import EmergencyDashboard from '../components/EmergencyDashboard';

export default function ParentHome() {
  const navigate = useNavigate();
  const { currentUser, linkKey, childName, setChild, updateProfile } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingChild, setEditingChild] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [childNameInput, setChildNameInput] = useState(childName || '');
  const childInputRef = useRef(null);

  useEffect(() => {
    if (!linkKey) { setActivities([]); setLoading(false); return; }
    setActivities([]);
    setLoading(true);
    setError(false);
    getAllActivities(linkKey).then((data) => {
      setActivities(data);
      setLoading(false);
      setError(false);
    }).catch(() => {
      setLoading(false);
      setError(true);
    });
  }, [linkKey]);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => {
    if (!a.created_at) return false;
    const d = a.created_at ? new Date(a.created_at) : new Date();
    return d.toDateString() === today;
  });

  const todayByType = {
    feeding: todayActivities.filter(a => a.activity_type === 'feeding'),
    sleep: todayActivities.filter(a => a.activity_type === 'sleep'),
    diaper: todayActivities.filter(a => a.activity_type === 'diaper'),
  };

  function timeAgo(date) {
    if (!date) return '';
    const d = new Date(date);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const displayActivities = todayActivities.slice(0, 5);

  async function saveChildName() {
    const trimmed = childNameInput.trim();
    if (!trimmed || trimmed === childName) {
      setEditingChild(false);
      return;
    }
    setChild(trimmed);
    if (currentUser) {
      try {
        await updateProfile({ childName: trimmed });
      } catch (e) {
        console.error('Failed to save child name:', e);
      }
    }
    setEditingChild(false);
  }

  useEffect(() => {
    if (editingChild && childInputRef.current) {
      childInputRef.current.focus();
      childInputRef.current.select();
    }
  }, [editingChild]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-on-surface-variant">{greeting}</p>
          {editingChild ? (
            <div className="flex items-center gap-2">
              <input
                ref={childInputRef}
                value={childNameInput}
                onChange={(e) => setChildNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveChildName();
                  if (e.key === 'Escape') { setEditingChild(false); setChildNameInput(childName || ''); }
                }}
                onBlur={saveChildName}
                className="text-2xl font-bold text-on-surface tracking-tight bg-transparent border-b-2 border-primary outline-none py-0.5 w-full"
                placeholder="Child's name"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface tracking-tight">{childName || 'Your Child'}</h1>
              <button
                onClick={() => { setChildNameInput(childName || ''); setEditingChild(true); }}
                className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 card-interactive"
              >
                <span className="material-symbols-outlined text-primary text-[14px]">edit</span>
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center card-interactive">
            <span className="material-symbols-outlined text-primary text-[20px]">person</span>
          </button>
        </div>
      </div>

      {/* Today Status */}
      <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-health-bg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-health text-[20px]">child_care</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-on-surface">{childName || 'Child'}'s Day</h3>
            <p className="text-xs text-on-surface-variant">{todayActivities.length} activities logged</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'feeding', label: 'Feedings', data: todayByType.feeding },
            { type: 'sleep', label: 'Naps', data: todayByType.sleep },
            { type: 'diaper', label: 'Changes', data: todayByType.diaper },
          ].map((m) => (
            <div key={m.type} className="rounded-xl p-3 text-center" style={{ backgroundColor: activityColors[m.type]?.bg }}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: activityColors[m.type]?.text }}>{activityIcons[m.type]}</span>
              <p className="text-lg font-bold text-on-surface mt-1">{m.data.length}</p>
              <p className="text-[10px] text-on-surface-variant">{m.label}</p>
              {m.data.length > 0 && (
                <p className="text-[10px] font-medium mt-0.5" style={{ color: activityColors[m.type]?.text }}>{timeAgo(m.data[0].created_at)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        {[
          { icon: 'calendar_month', label: 'Calendar', bg: '#1a2b3c', text: '#8192a7', path: '/parent/calendar' },
          { icon: 'location_on', label: 'Track', bg: '#E6F6FA', text: '#45B7D1', path: '/parent/tracking' },
          { icon: 'shield', label: 'Safety', bg: '#FDE8EC', text: '#E85D75', path: '/safety-vault' },
        ].map((action, i) => (
          <button key={i} onClick={() => navigate(action.path)} className="flex-1 card p-3 flex flex-col items-center gap-2 card-interactive">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.bg }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: action.text }}>{action.icon}</span>
            </div>
            <span className="text-xs font-semibold text-on-surface">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Emergency */}
      <button
        onClick={() => setShowEmergency(true)}
        className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-secondary/10 text-secondary border border-secondary/20 card-interactive animate-fade-in-up"
        style={{ animationDelay: '0.07s' }}
      >
        <span className="material-symbols-outlined text-[18px]">emergency</span>
        Emergency Alert
      </button>

      {/* Timeline */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Today</h2>
        {loading ? (
          <SkeletonTimeline count={4} />
        ) : error && displayActivities.length === 0 ? (
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-variant/40 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">cloud_off</span>
            </div>
            <p className="text-sm font-semibold text-on-surface">Couldn't load activities</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-[260px]">You may be offline or Firestore rules are blocking reads. Saved logs will appear here once synced.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold card-interactive"
            >
              Retry
            </button>
          </div>
        ) : displayActivities.length === 0 ? (
          <EmptyState
            icon="child_care"
            title="No activities today"
            message="Check back later or ask your caregiver to log activities."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-outline-variant/15">
              {displayActivities.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activityColors[item.activity_type]?.bg || '#edeeef' }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: activityColors[item.activity_type]?.text || '#44474c' }}>
                      {activityIcons[item.activity_type] || 'circle'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface break-words">
                      {item.activity_type} — {item.details?.option || 'logged'}
                      {item.details?.quantity ? ` (${item.details.quantity})` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-outline flex-shrink-0">
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Dashboard */}
      {showEmergency && (
        <EmergencyDashboard onClose={() => setShowEmergency(false)} linkKey={linkKey} caregiverId={currentUser?.uid} />
      )}
    </div>
  );
}
