import { saveCaregiverLocation } from './supabaseService';

let watchId = null;

// Start watching position and save to Firestore
export function startLocationTracking(caregiverId) {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }

  // Get initial position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      saveCaregiverLocation(caregiverId, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => console.error('Location error:', error),
    { enableHighAccuracy: true }
  );

  // Watch position changes
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      saveCaregiverLocation(caregiverId, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => console.error('Watch position error:', error),
    {
      enableHighAccuracy: true,
      maximumAge: 10000,      // 10 seconds
      distanceFilter: 10,     // 10 meters
    }
  );
}

// Stop watching position
export function stopLocationTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// Get current position once
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
