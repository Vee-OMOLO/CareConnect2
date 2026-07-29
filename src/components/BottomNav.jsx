import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const parentTabs = [
  { path: '/parent', icon: 'home', label: 'Home' },
  { path: '/parent/calendar', icon: 'calendar_month', label: 'Calendar' },
  { path: '/parent/tracking', icon: 'location_on', label: 'Track' },
  { path: '/safety-vault', icon: 'shield', label: 'Safety' },
  { path: '/profile', icon: 'person', label: 'Profile' },
];

const caregiverTabs = [
  { path: '/caregiver', icon: 'home', label: 'Home' },
  { path: '/caregiver/log', icon: 'edit_note', label: 'Log' },
  { path: '/safety-vault', icon: 'shield', label: 'Safety' },
  { path: '/profile', icon: 'person', label: 'Profile' },
];

export default function BottomNav() {
  const { userRole } = useAuth();
  const location = useLocation();
  const tabs = userRole === 'parent' ? parentTabs : caregiverTabs;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="mx-2 mb-2 bg-white/90 backdrop-blur-lg rounded-2xl border border-black/[0.04] shadow-[0_-1px_3px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-around py-2">
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-150 active:scale-90"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 w-5 h-[2px] bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`material-symbols-outlined text-[24px] transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-outline'
                }`}>
                  {tab.icon}
                </span>
                <span className={`text-[11px] font-semibold transition-colors duration-200 ${
                  isActive ? 'text-primary' : 'text-outline'
                }`}>
                  {tab.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
