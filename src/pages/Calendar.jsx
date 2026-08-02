import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { activityColors } from '../constants/activityData';
import { getAllEvents, addLocalEvent } from '../services/demoLogger';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Real events stream from Supabase when a family is linked; empty state shown otherwise.

const eventIcons = { medicine: 'medication', health: 'local_hospital', feeding: 'restaurant', play: 'child_care' };

export default function Calendar() {
  const { linkKey } = useAuth();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [events, setEvents] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'health', notes: '' });

  // Load events from Supabase when a family is linked.
  useEffect(() => {
    if (!linkKey) {
      setEvents([]);
      setUpcoming([]);
      return;
    }

    getAllEvents(linkKey).then((data) => {
      setEvents(data.map(ev => {
        const d = ev.date ? new Date(ev.date) : null;
        return {
          day: d ? d.getDate() : null,
          type: ev.type || 'health',
          label: ev.title || ev.type || 'Event',
          date: ev.date,
        };
      }));
      setUpcoming(data.map(ev => ({
        title: ev.title || 'Event',
        time: ev.date ? new Date(ev.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled',
        type: ev.type || 'health',
        icon: eventIcons[ev.type] || 'event',
      })));
    }).catch(() => {
      setEvents([]);
      setUpcoming([]);
    });
  }, [linkKey]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, currentMonth: true, isToday: i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear() });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, currentMonth: false });
  }

  function goBack() {
    setDirection(-1);
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function goForward() {
    setDirection(1);
    setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Calendar" subtitle="Schedule & reminders" onBack />

      {/* Calendar Grid */}
      <div className="card p-4 animate-fade-in-up">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center card-interactive"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_left</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
            <h2 className="text-base font-bold text-on-surface">{months[month]} {year}</h2>
          </div>
          <button
            onClick={goForward}
            className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center card-interactive"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
          </button>
          <button
            onClick={() => setShowAddEvent(true)}
            className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center card-interactive"
            aria-label="Add event"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">add</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {daysOfWeek.map((d, i) => (
            <div key={i} className="text-center text-[11px] font-semibold text-outline py-1">{d}</div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${month}-${year}`}
            initial={{ opacity: 0, x: direction * 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="grid grid-cols-7 gap-1"
          >
            {calendarDays.map((d, i) => {
              const event = events.find(e => e.day === d.day && d.currentMonth);
              return (
                <button
                  key={i}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all card-interactive ${
                    d.isToday ? 'bg-primary text-on-primary font-bold shadow-sm' :
                    d.currentMonth ? 'text-on-surface hover:bg-surface-container-low' :
                    'text-outline/25'
                  }`}
                  aria-label={d.currentMonth ? `${d.day} ${months[month]} ${year}${event ? ` — ${event.label}` : ''}` : undefined}
                >
                  {d.day}
                  {event && !d.isToday && (
                    <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activityColors[event.type]?.text }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        {events.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant/15">
            <span className="text-[10px] text-outline font-medium">Events:</span>
            {[...new Set(events.map(e => e.type))].map(type => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activityColors[type]?.text }} />
                <span className="text-[10px] text-on-surface-variant capitalize">{type}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.03s' }}>
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Upcoming</h2>
        <div className="flex flex-col gap-2">
          {upcoming.map((event, i) => {
            const c = activityColors[event.type];
            return (
              <div key={i} className="card p-3 card-interactive" style={{ borderLeft: `3px solid ${c?.text || '#74777d'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c?.bg || '#edeeef' }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: c?.text || '#44474c' }}>{event.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{event.title}</p>
                    <p className="text-xs text-outline mt-0.5">{event.time}</p>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px] flex-shrink-0">chevron_right</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up shadow-lg">
            <div className="w-10 h-1 bg-outline-variant/40 rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold text-on-surface mb-4">Add Event</h2>
            <div className="flex flex-col gap-3">
              <input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Event title (e.g., Doctor's Appointment)"
                className="glass-input"
              />
              <input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="glass-input"
              />
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="glass-input"
              >
                <option value="health">Health</option>
                <option value="medicine">Medicine</option>
                <option value="feeding">Feeding</option>
                <option value="play">Play</option>
              </select>
              <textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="glass-input min-h-[80px] resize-none"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-xl font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newEvent.title || !newEvent.date) return;
                    await addLocalEvent(linkKey, {
                      title: newEvent.title,
                      date: new Date(newEvent.date).toISOString(),
                      type: newEvent.type,
                      notes: newEvent.notes,
                    });
                    toast?.success?.('Event added');
                    setShowAddEvent(false);
                    setNewEvent({ title: '', date: '', type: 'health', notes: '' });
                    // Refresh events
                    getAllEvents(linkKey).then((data) => {
                      setEvents(data.map(ev => {
                        const d = ev.date ? new Date(ev.date) : null;
                        return { day: d ? d.getDate() : null, type: ev.type || 'health', label: ev.title || ev.type || 'Event', date: ev.date };
                      }));
                      setUpcoming(data.map(ev => ({
                        title: ev.title || 'Event',
                        time: ev.date ? new Date(ev.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Scheduled',
                        type: ev.type || 'health',
                        icon: eventIcons[ev.type] || 'event',
                      })));
                    });
                  }}
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
