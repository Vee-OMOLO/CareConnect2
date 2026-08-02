import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { processOfflineQueue } from './services/firestoreService';
import { isNewVersion, startUpdateWatcher } from './utils/updateManager';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';
import UpdateBanner from './components/UpdateBanner';
import WhatsNewSheet from './components/WhatsNewSheet';
import Login from './pages/Login';
import Register from './pages/Register';
import RoleSelection from './pages/RoleSelection';
import ParentHome from './pages/ParentHome';
import CaregiverHome from './pages/CaregiverHome';
import LinkFamily from './pages/LinkFamily';
import LogActivity from './pages/LogActivity';
import Calendar from './pages/Calendar';
import TrackingMap from './pages/TrackingMap';
import SafetyVault from './pages/SafetyVault';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function RoleGate({ children }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (!userRole) return <Navigate to="/role-selection" />;
  return children;
}

const fadeIn = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
};

function Page({ children }) {
  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}

export default function App() {
  const { currentUser, userRole, accountVersion } = useAuth();
  const [updateAvailable, setUpdateAvailable] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  // Flush any offline-queued actions (activities, SOS, events) on boot
  // and whenever the connection comes back.
  useEffect(() => {
    processOfflineQueue();
    const handleOnline = () => processOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Live update detection + one-time "What's New" per version.
  useEffect(() => {
    const stopWatcher = startUpdateWatcher((version) => setUpdateAvailable(version));
    if (isNewVersion()) {
      const t = setTimeout(() => setShowWhatsNew(true), 900);
      return () => { clearTimeout(t); stopWatcher(); };
    }
    return stopWatcher;
  }, []);

  const isAuthPage = !currentUser || !userRole;

  return (
    <>
      {isAuthPage ? (
        <div className="app-shell-auth">
          <OfflineBanner />
          <ErrorBoundary>
            <Routes key={`auth-${accountVersion}`}>
              <Route path="/login" element={
                <Page>{currentUser ? <Navigate to={userRole === 'parent' ? '/parent' : userRole === 'caregiver' ? '/caregiver' : '/role-selection'} /> : <Login />}</Page>
              } />
              <Route path="/register" element={
                <Page>{currentUser ? <Navigate to="/role-selection" /> : <Register />}</Page>
              } />
              <Route path="/role-selection" element={
                <Page><ProtectedRoute><RoleSelection /></ProtectedRoute></Page>
              } />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </ErrorBoundary>
        </div>
      ) : (
        <div className="app-shell">
          <OfflineBanner />
          <main className="app-main">
            <div className="app-content">
              <ErrorBoundary>
                <Routes key={`app-${accountVersion}`}>
                  <Route path="/parent" element={
                    <Page><RoleGate><ParentHome /></RoleGate></Page>
                  } />
                  <Route path="/caregiver" element={
                    <Page><RoleGate><CaregiverHome /></RoleGate></Page>
                  } />
                  <Route path="/caregiver/log" element={
                    <Page><RoleGate><LogActivity /></RoleGate></Page>
                  } />
                  <Route path="/caregiver/link" element={
                    <Page><RoleGate><LinkFamily /></RoleGate></Page>
                  } />
                  <Route path="/parent/calendar" element={
                    <Page><RoleGate><Calendar /></RoleGate></Page>
                  } />
                  <Route path="/parent/tracking" element={
                    <Page><RoleGate><TrackingMap /></RoleGate></Page>
                  } />
                  <Route path="/safety-vault" element={
                    <Page><RoleGate><SafetyVault /></RoleGate></Page>
                  } />
                  <Route path="/profile" element={
                    <Page><RoleGate><Profile /></RoleGate></Page>
                  } />
                  <Route path="*" element={<Navigate to={userRole === 'parent' ? '/parent' : '/caregiver'} />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </main>
          <BottomNav />
        </div>
      )}

      {/* Update banner — new version shipped, prompt to reload */}
      {updateAvailable && (
        <UpdateBanner newVersion={updateAvailable} onReload={() => window.location.reload()} />
      )}

      {/* One-time per-version changelog */}
      {showWhatsNew && <WhatsNewSheet onClose={() => setShowWhatsNew(false)} />}
    </>
  );
}
