import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { activityColors } from '../constants/activityData';

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const sampleEvents = [
  { day: 8, type: 'medicine', label: 'Med' },
  { day: 12, type: 'health', label: 'Appt' },
  { day: 20, type: 'medicine', label: 'Med' },
  { day: 25, type: 'health', label: 'Check' },
];

const upcomingEvents = [
  { title: 'Blood pressure check', time: 'Today, 2:00 PM', type: 'health', icon: 'favorite' },
  { title: 'Medication refill reminder', time: 'Tomorrow, 9:00 AM', type: 'medicine', icon: 'medication' },
  { title: 'Doctor appointment', time: 'Mar 20, 10:30 AM', type: 'health', icon: 'local_hospital' },
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0);

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
              const event = sampleEvents.find(e => e.day === d.day && d.currentMonth);
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
        {sampleEvents.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-outline-variant/15">
            <span className="text-[10px] text-outline font-medium">Events:</span>
            {[...new Set(sampleEvents.map(e => e.type))].map(type => (
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
          {upcomingEvents.map((event, i) => {
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
    </div>
  );
}
