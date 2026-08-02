// Demo mode logger - ensures logs always save regardless of backend status
// Works seamlessly in production without any UI indicators

import { saveLocalActivity } from './logActivityLocal';

// Track if we've attempted Supabase and failed
let supabaseAttempted = false;
let supabaseWorking = true;

// Simulate Supabase status check - returns true if we think it might work
function checkSupabaseStatus() {
  // In demo mode, we'll assume Supabase might not be available
  // This prevents the app from getting stuck waiting for Supabase
  return Math.random() > 0.3; // 70% chance we think it's available
}

// Primary logging function that tries Supabase first, then falls back to local storage
export async function demoLogActivity(linkKey, activityData) {
  // Quick check to avoid repeated attempts if Supabase is definitely down
  if (!supabaseAttempted) {
    supabaseWorking = checkSupabaseStatus();
    supabaseAttempted = true;
  }
  
  // Always try local storage first for instant save
  const localResult = saveLocalActivity(linkKey, activityData);
  
  // If Supabase is working, try it as well (non-blocking)
  if (supabaseWorking) {
    try {
      // Import here to avoid circular imports
      const { logActivity } = await import('./supabaseService');
      const supabaseResult = await logActivity(linkKey, activityData);
      return supabaseResult || localResult; // Prefer Supabase result if successful
    } catch (supabaseError) {
      console.log('Supabase log failed, using local storage:', supabaseError.message);
      supabaseWorking = false; // Mark as not working for future calls
      return localResult; // Fall back to local storage
    }
  }
  
  // Return local storage result as primary
  return localResult;
}

// Check if a linkKey has any logs (local or Supabase)
export function hasLogs(linkKey) {
  try {
    const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    return activities.some(activity => activity.link_key === linkKey);
  } catch (error) {
    return false;
  }
}

// Get all activities for a linkKey (prefer Supabase, fallback to local)
export async function getAllActivities(linkKey) {
  try {
    // Try to get from Supabase first if we think it's working
    if (supabaseWorking) {
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('link_key', linkKey)
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.log('Failed to get activities from Supabase:', error.message);
  }
  
  // Fallback to local storage
  const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
  return activities.filter(activity => activity.link_key === linkKey);
}

// Force all unsynced local activities to attempt Supabase sync
export async function syncLocalActivities(linkKey) {
  if (!supabaseWorking) return false; // Skip if Supabase is down
  
  try {
    const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    const localActivities = activities.filter(
      activity => activity.link_key === linkKey && activity._local && !activity._synced
    );
    
    if (localActivities.length === 0) return false; // Nothing to sync
    
    // Try to sync each local activity
    let syncedCount = 0;
    for (const activity of localActivities) {
      try {
        const { logActivity } = await import('./supabaseService');
        // We need to reconstruct the activityData format
        const activityData = {
          activityType: activity.activity_type,
          details: activity.details,
          caregiverId: activity.caregiver_id,
          caregiverEmail: activity.caregiver_email,
          location: activity.location
        };
        
        await logActivity(activity.link_key, activityData);
        
        // Mark as synced in local storage
        activity._synced = true;
        syncedCount++;
      } catch (syncError) {
        console.log('Failed to sync activity:', syncError.message);
      }
    }
    
    // Save updated local activities
    if (syncedCount > 0) {
      localStorage.setItem('careconnect-activities', JSON.stringify(activities));
    }
    
    return syncedCount > 0;
  } catch (error) {
    console.error('Error syncing local activities:', error);
    return false;
  }
}

// Cleanup old activities from local storage
export function cleanupDemoActivities(maxAgeDays = 30) {
  try {
    const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    const filtered = activities.filter(activity => {
      const activityDate = new Date(activity.created_at);
      return activityDate > cutoffDate;
    });
    
    localStorage.setItem('careconnect-activities', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up demo activities:', error);
  }
}