import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
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

  const isAuthPage = !currentUser || !userRole;

  if (isAuthPage) {
    return (
      <div className="app-shell-auth">
        <OfflineBanner />
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
