import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllActivities, getAllEvents } from '../services/demoLogger';
import EmergencyDashboard from '../components/EmergencyDashboard';
import { activityColors, activityTypes } from '../constants/activityData';
import { SkeletonTimeline } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

export default function CaregiverHome() {
  const navigate = useNavigate();
  const { currentUser, linkKey, childName, parentEmail } = useAuth();
  const [showEmergency, setShowEmergency] = useState(false);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!linkKey) { setActivities([]); setEvents([]); setLoading(false); return; }
    setActivities([]);
    setLoading(true);
    setError(false);
    
    // Load activities using demo logger (localStorage + Supabase fallback)
    getAllActivities(linkKey).then((data) => {
      setActivities(data);
      setLoading(false);
      setError(false);
    }).catch(() => {
      setLoading(false);
      setError(true);
    });
    
    // Load calendar events
    getAllEvents(linkKey).then((data) => {
      setEvents(data);
    }).catch(() => {
      setEvents([]);
    });
  }, [linkKey]);

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const today = new Date().toDateString();
  const todayActivities = activities.filter(a => {
    if (!a.created_at) return false;
    const d = new Date(a.created_at);
    return d.toDateString() === today;
  });

  const displayLogs = todayActivities.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
  {/* Header */}
  <div className="flex items-center justify-between animate-fade-in-up">
  <div className="min-w-0">
  <p className="text-sm text-on-surface-variant">{greeting}</p>
  <h1 className="text-2xl font-bold text-on-surface tracking-tight">{childName ? `Caring for ${childName}` : 'Child'}</h1>
  {parentEmail && (
  <p className="text-xs text-outline break-words mt-0.5">Linked to {parentEmail}</p>
  )}
  </div>
  <button
    onClick={() => setShowEmergency(true)}
    className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-xl font-semibold text-sm emergency-glow card-interactive"
  >
    <span className="material-symbols-outlined text-[18px]">emergency_share</span>
    Emergency
  </button>
  </div>

      {/* Family Link Card */}
      <div className="card p-4 animate-fade-in-up" style={{ animationDelay: '0.02s' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">family_restroom</span>
          </div>
          <div className="min-w-0 flex-1">
            {parentEmail && childName ? (
              <>
                <p className="text-xs text-on-surface-variant">Connected Family</p>
                <p className="text-sm font-semibold text-on-surface break-words">{childName} <span className="font-normal text-on-surface-variant">· {parentEmail}</span></p>
              </>
            ) : (
              <>
                <p className="text-xs text-on-surface-variant">Family Link</p>
                <p className="text-sm font-semibold text-on-surface break-words">Not connected yet</p>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/caregiver/link')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold card-interactive flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">{parentEmail && childName ? 'edit' : 'link'}</span>
            {parentEmail && childName ? 'Manage' : 'Link Now'}
          </button>
        </div>
      </div>

      {/* Quick Log */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Quick Log</h2>
        <div className="grid grid-cols-3 gap-2">
          {activityTypes.map((a) => (
            <button
              key={a.type}
              onClick={() => navigate(`/caregiver/log?type=${a.type}`)}
              className="card p-3 flex flex-col items-center gap-2 card-interactive"
              style={{ backgroundColor: activityColors[a.type]?.bg }}
            >
              <span className="material-symbols-outlined text-[24px]" style={{ color: activityColors[a.type]?.text }}>{a.icon}</span>
              <span className="text-xs font-semibold text-on-surface text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Link */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <button
          onClick={() => navigate('/caregiver/calendar')}
          className="w-full card p-3 flex items-center justify-between card-interactive"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
            <span className="text-sm font-semibold text-on-surface">View Calendar</span>
          </div>
          <span className="material-symbols-outlined text-outline text-[18px]">{events.length > 0 ? `${events.length} event${events.length > 1 ? 's' : ''}` : 'No events yet'}</span>
        </button>
      </div>

      {/* Recent Logs */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.06s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Today's Log</h2>
        {loading ? (
          <SkeletonTimeline count={3} />
        ) : error && displayLogs.length === 0 ? (
          <div className="card p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-variant/40 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant text-[24px]">cloud_off</span>
            </div>
            <p className="text-sm font-semibold text-on-surface">Couldn't load logs</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-[260px]">You may be offline or Supabase is not responding. New logs are kept locally and will sync.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold card-interactive"
            >
              Retry
            </button>
          </div>
        ) : displayLogs.length === 0 ? (
          <EmptyState
            icon="edit_note"
            title="No logs yet today"
            message="Tap an activity type above to log your first one."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="divide-y divide-outline-variant/15">
              {displayLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activityColors[log.activity_type]?.bg || '#edeeef' }}>
                    <span className="material-symbols-outlined text-[16px]" style={{ color: activityColors[log.activity_type]?.text || '#44474c' }}>
                      {activityTypes.find(a => a.type === log.activity_type)?.icon || 'circle'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface break-words">
                      {log.details?.option || log.activity_type}
                      {log.details?.quantity ? ` — ${log.details.quantity}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-outline flex-shrink-0">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Events */}
      {events.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.09s' }}>
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Upcoming Events</h2>
          <div className="flex flex-col gap-2">
            {events.slice(0, 3).map((event, i) => (
              <div key={i} className="card p-3 card-interactive">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activityColors[event.type]?.bg || '#edeeef' }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: activityColors[event.type]?.text || '#44474c' }}>
                      {activityTypes.find(a => a.type === event.type)?.icon || 'event'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface break-words">{event.title}</p>
                    <p className="text-xs text-outline mt-0.5">
                      {event.date ? new Date(event.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
                    </p>
                    {event.notes && <p className="text-xs text-on-surface-variant mt-0.5 break-words">{event.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Dashboard */}
      {showEmergency && (
        <EmergencyDashboard onClose={() => setShowEmergency(false)} linkKey={linkKey} caregiverId={currentUser?.uid} />
      )}
    </div>
  );
}
