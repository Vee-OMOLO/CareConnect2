import { db } from '../firebase';
import {
  collection, addDoc, getDocs, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, orderBy, limit
} from 'firebase/firestore';

// Build the composite link key from parent email + child name
export function buildLinkKey(parentEmail, childName) {
  const email = parentEmail.trim().toLowerCase();
  const name = childName.trim().toLowerCase().replace(/\s+/g, ' ');
  return `${email}_${name}`;
}

// Log an activity
export async function logActivity(linkKey, activityData) {
  try {
    const docRef = await addDoc(collection(db, 'activityLogs', linkKey, 'logs'), {
      ...activityData,
      childId: linkKey,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Error logging activity:', e);
    // Save to offline queue
    saveToOfflineQueue('activity', { linkKey, ...activityData });
    return null;
  }
}

// Subscribe to real-time activity logs
export function subscribeToActivities(linkKey, callback, onError) {
  const q = query(
    collection(db, 'activityLogs', linkKey, 'logs'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(activities);
  }, (error) => {
    console.error('Activity subscription error:', error);
    if (onError) onError(error);
  });
}

// Create an emergency alert
export async function createEmergencyAlert(linkKey, location) {
  try {
    const docRef = await addDoc(collection(db, 'sosAlerts'), {
      childId: linkKey,
      location: location,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      status: 'active',
    });

    // Also add to activity timeline
    await addDoc(collection(db, 'activityLogs', linkKey, 'logs'), {
      activityType: 'sos',
      details: { option: 'Emergency SOS Triggered', notes: 'Location shared' },
      location: location,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      caregiverId: 'current-user',
    });

    return docRef.id;
  } catch (e) {
    console.error('Error creating emergency alert:', e);
    saveToOfflineQueue('sos', { linkKey, location });
    return null;
  }
}

// Add a calendar event
export async function addEvent(linkKey, eventData) {
  try {
    const docRef = await addDoc(collection(db, 'child_events'), {
      ...eventData,
      childId: linkKey,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (e) {
    console.error('Error adding event:', e);
    saveToOfflineQueue('event', { linkKey, ...eventData });
    return null;
  }
}

// Subscribe to events
export function subscribeToEvents(linkKey, callback) {
  const q = query(
    collection(db, 'child_events'),
    where('childId', '==', linkKey),
    orderBy('date', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(events);
  });
}

// Save caregiver location
export async function saveCaregiverLocation(caregiverId, location) {
  try {
    await updateDoc(doc(db, 'caregiver_locations', caregiverId), {
      lat: location.lat,
      lng: location.lng,
      timestamp: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    // Document might not exist, try creating
    try {
      await addDoc(collection(db, 'caregiver_locations'), {
        caregiverId: caregiverId,
        lat: location.lat,
        lng: location.lng,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
      });
    } catch (e2) {
      console.error('Error saving location:', e2);
    }
  }
}

// Subscribe to caregiver location
export function subscribeToCaregiverLocation(caregiverId, callback) {
  return onSnapshot(doc(db, 'caregiver_locations', caregiverId), (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    }
  });
}

// Save emergency contacts to Firestore
export async function saveEmergencyContacts(linkKey, contacts) {
  try {
    for (const contact of contacts) {
      await addDoc(collection(db, 'children', linkKey, 'emergencyContacts'), {
        ...contact,
        childId: linkKey,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error('Error saving contacts:', e);
  }
}

// Offline queue management
function saveToOfflineQueue(type, data) {
  try {
    const queue = JSON.parse(localStorage.getItem('careconnect-offline-queue') || '[]');
    queue.push({ type, data, timestamp: new Date().toISOString() });
    localStorage.setItem('careconnect-offline-queue', JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save to offline queue:', e);
  }
}

export async function processOfflineQueue() {
  try {
    const queue = JSON.parse(localStorage.getItem('careconnect-offline-queue') || '[]');
    if (queue.length === 0) return;

    const processed = [];
    for (const item of queue) {
      switch (item.type) {
        case 'activity':
          await logActivity(item.data.linkKey, item.data);
          processed.push(item);
          break;
        case 'sos':
          await createEmergencyAlert(item.data.linkKey, item.data.location);
          processed.push(item);
          break;
        case 'event':
          await addEvent(item.data.linkKey, item.data);
          processed.push(item);
          break;
      }
    }

    // Remove processed items
    const remaining = queue.filter(item => !processed.includes(item));
    localStorage.setItem('careconnect-offline-queue', JSON.stringify(remaining));
  } catch (e) {
    console.error('Error processing offline queue:', e);
  }
}
