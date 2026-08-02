import { sendNotification } from './supabaseService';

// Send a notification to the parent about a new activity
export async function notifyParent(linkKey, activityType, details) {
  try {
    await sendNotification(linkKey, {
      type: 'activity',
      title: getNotificationTitle(activityType),
      body: getNotificationBody(activityType, details),
    });
  } catch {
    // Save to local storage for offline
    const pending = JSON.parse(localStorage.getItem('careconnect-pending-notifications') || '[]');
    pending.push({
      childId: linkKey,
      type: 'activity',
      title: getNotificationTitle(activityType),
      body: getNotificationBody(activityType, details),
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('careconnect-pending-notifications', JSON.stringify(pending));
  }
}

// Send emergency notification
export async function notifyEmergency(linkKey, location) {
  try {
    await sendNotification(linkKey, {
      type: 'sos',
      title: '🚨 EMERGENCY',
      body: `Emergency alert triggered at ${location?.lat?.toFixed(4) || 'unknown'}, ${location?.lng?.toFixed(4) || 'unknown'}`,
      priority: 'high',
    });
  } catch {
    // Silently fail — emergency alert is best-effort
  }
}

function getNotificationTitle(type) {
  const titles = {
    feeding: 'Feeding Logged',
    sleep: 'Sleep Update',
    diaper: 'Diaper Change',
    play: 'Play Time',
    medicine: 'Medicine Given',
    health: 'Health Check',
    sos: '🚨 EMERGENCY',
  };
  return titles[type] || 'Activity Update';
}

function getNotificationBody(type, details) {
  if (details?.option) return details.option;
  const bodies = {
    feeding: 'New feeding activity recorded',
    sleep: 'Sleep status updated',
    diaper: 'Diaper change logged',
    play: 'Play time recorded',
    medicine: 'Medicine administered',
    health: 'Health check completed',
    sos: 'Emergency alert triggered',
  };
  return bodies[type] || 'New activity logged';
}

// Show local notification (for foreground)
export function showLocalNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.svg' });
  }
}

// Request notification permission
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}
