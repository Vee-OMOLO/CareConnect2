import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';
import OfflineBanner from './components/OfflineBanner';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const RoleSelection = lazy(() => import('./pages/RoleSelection'));
const ParentHome = lazy(() => import('./pages/ParentHome'));
const CaregiverHome = lazy(() => import('./pages/CaregiverHome'));
const LogActivity = lazy(() => import('./pages/LogActivity'));
const Calendar = lazy(() => import('./pages/Calendar'));
const TrackingMap = lazy(() => import('./pages/TrackingMap'));
const SafetyVault = lazy(() => import('./pages/SafetyVault'));
const Profile = lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-outline-variant border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-outline font-medium">Loading...</p>
      </div>
    </div>
  );
}

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

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

function AnimatedPage({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

export default function App() {
  const { currentUser, userRole, accountVersion } = useAuth();
  const location = useLocation();

  const isAuthPage = !currentUser || !userRole;

  if (isAuthPage) {
    return (
      <div className="app-shell-auth">
        <OfflineBanner />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes key={`auth-${accountVersion}`} location={location}>
                <Route path="/login" element={
                  <AnimatedPage>{currentUser ? <Navigate to={userRole === 'parent' ? '/parent' : userRole === 'caregiver' ? '/caregiver' : '/role-selection'} /> : <Login />}</AnimatedPage>
                } />
                <Route path="/register" element={
                  <AnimatedPage>{currentUser ? <Navigate to="/role-selection" /> : <Register />}</AnimatedPage>
                } />
                <Route path="/role-selection" element={
                  <AnimatedPage><ProtectedRoute><RoleSelection /></ProtectedRoute></AnimatedPage>
                } />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <OfflineBanner />
      <main className="app-main">
        <div className="app-content">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes key={`app-${accountVersion}`} location={location}>
                  <Route path="/parent" element={
                    <AnimatedPage><RoleGate><ParentHome /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/caregiver" element={
                    <AnimatedPage><RoleGate><CaregiverHome /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/caregiver/log" element={
                    <AnimatedPage><RoleGate><LogActivity /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/parent/calendar" element={
                    <AnimatedPage><RoleGate><Calendar /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/parent/tracking" element={
                    <AnimatedPage><RoleGate><TrackingMap /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/safety-vault" element={
                    <AnimatedPage><RoleGate><SafetyVault /></RoleGate></AnimatedPage>
                  } />
                  <Route path="/profile" element={
                    <AnimatedPage><RoleGate><Profile /></RoleGate></AnimatedPage>
                  } />
                  <Route path="*" element={<Navigate to={userRole === 'parent' ? '/parent' : '/caregiver'} />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
