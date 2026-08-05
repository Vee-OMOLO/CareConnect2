import { saveCaregiverLocation } from './supabaseService';

let watchId = null;

// Start watching position and saving it to Supabase (with the family link so
// the parent can read the caregiver's live location).
export function startLocationTracking(caregiverId, linkKey) {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }

  const save = (position) => {
    saveCaregiverLocation(caregiverId, linkKey, {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });
  };

  // Get initial position
  navigator.geolocation.getCurrentPosition(save, (error) => console.error('Location error:', error), { enableHighAccuracy: true });

  // Watch position changes
  watchId = navigator.geolocation.watchPosition(
    save,
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
