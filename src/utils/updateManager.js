import { APP_VERSION } from '../config/appVersion';

const SEEN_VERSION_KEY = 'careconnect-seen-version';
const UPDATE_INTERVAL_MS = 60000;

// ---------------------------------------------------------------------------
// Boot-time data migration. Called once before the app renders so users coming
// from older builds recover state gracefully (no lost sessions, no stuck UI).
// ---------------------------------------------------------------------------
export function runMigrations() {
  try {
    // 1) Legacy: an earlier broken build wrote the role under a wrong key.
    //    Recover it so previously "stuck" users keep their chosen role.
    const legacyRole = localStorage.getItem('careconnect-user-role');
    if (legacyRole && !localStorage.getItem('careconnect-role')) {
      localStorage.setItem('careconnect-role', legacyRole);
    }
    localStorage.removeItem('careconnect-user-role');

    // 2) Dead key: read by an older SafetyVault but never written by the app.
    localStorage.removeItem('careconnect-link-key');

    // 3) Repair corrupted JSON queues so offline sync never crashes.
    ['careconnect-offline-queue', 'careconnect-pending-notifications'].forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) throw new Error('queue is not an array');
      } catch {
        localStorage.setItem(key, '[]');
      }
    });
  } catch (e) {
    // Never let a migration failure block the app.
    console.error('App migration failed:', e);
  }
}

// ---------------------------------------------------------------------------
// "What's New" — true until the user has seen the current version's sheet.
// ---------------------------------------------------------------------------
export function isNewVersion() {
  try {
    return localStorage.getItem(SEEN_VERSION_KEY) !== APP_VERSION;
  } catch {
    return false;
  }
}

export function markVersionSeen() {
  try {
    localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// Live update detection. Polls public/version.json (served by the host) and
// fires `onUpdate(newVersion)` when a newer version than this bundle ships.
// ---------------------------------------------------------------------------
export function startUpdateWatcher(onUpdate) {
  const check = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.version && compareVersions(data.version, APP_VERSION) > 0) {
        onUpdate(data.version);
      }
    } catch {
      // Offline or host unreachable — try again on the next tick.
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') check();
  };

  check();
  const interval = setInterval(check, UPDATE_INTERVAL_MS);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleVisibility);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleVisibility);
  };
}

export function getAppVersion() {
  return APP_VERSION;
}

function parseVersion(v) {
  return String(v || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
}

function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0) ? 1 : -1;
  }
  return 0;
}
