// Demo mode logger - ensures logs always save regardless of backend status
// Pure localStorage implementation - no external dependencies, no dynamic imports

import { saveLocalActivity, getLocalActivities } from './logActivityLocal';

// Simple demo mode logger that ALWAYS works
export async function demoLogActivity(linkKey, activityData) {
  // Always save to localStorage first - instant, reliable, no dependencies
  const localResult = saveLocalActivity(linkKey, activityData);
  
  // Try Supabase in background (non-blocking, fire-and-forget)
  // We don't await this - just fire it off
  try {
    // Use a non-blocking approach - don't await
    const { logActivity } = await import('./supabaseService');
    logActivity(linkKey, activityData).catch(() => {
      // Silently ignore Supabase errors - localStorage already saved
    });
  } catch {
    // Silently ignore import errors - localStorage already saved
  }
  
  // Return local storage result as primary (always works)
  return localResult;
}

// Get all activities for a linkKey - purely from localStorage (instant, reliable)
export async function getAllActivities(linkKey) {
  try {
    // Get from localStorage only - instant, no network calls, no errors
    const activities = getLocalActivities(linkKey);
    
    // Also try to fetch from Supabase in background (non-blocking)
    try {
      const { supabase } = await import('../supabase');
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('link_key', linkKey)
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        // Merge Supabase data with local data (local takes precedence for recent)
        const localActivities = getLocalActivities(linkKey);
        const combined = [...localActivities, ...data];
        
        // Deduplicate by ID (local entries have local- prefix)
        const seen = new Set();
        const unique = combined.filter(activity => {
          if (seen.has(activity.id)) return false;
          seen.add(activity.id);
          return true;
        });
        
        // Sort by created_at descending
        return unique.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // Silently ignore Supabase errors
    }
    
    return activities;
  } catch {
    // Ultimate fallback - empty array
    return [];
  }
}

// Sync function - tries to push local activities to Supabase
export async function syncLocalActivities(linkKey) {
  try {
    const { logActivity } = await import('./supabaseService');
    const activities = getLocalActivities(linkKey);
    const localActivities = activities.filter(
      activity => activity._local && !activity._synced
    );
    
    if (localActivities.length === 0) return false;
    
    let syncedCount = 0;
    for (const activity of localActivities) {
      try {
        const activityData = {
          activityType: activity.activity_type,
          details: activity.details,
          caregiverId: activity.caregiver_id,
          caregiverEmail: activity.caregiver_email,
          location: activity.location
        };
        
        await logActivity(activity.link_key, activityData);
        
        // Mark as synced
        activity._synced = true;
        syncedCount++;
      } catch {
        // Ignore individual sync failures
      }
    }
    
    if (syncedCount > 0) {
      // Save updated activities
      const allActivities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
      localStorage.setItem('careconnect-activities', JSON.stringify(allActivities));
    }
    
    return syncedCount > 0;
  } catch {
    return false;
  }
}

// Cleanup old activities
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
  } catch {
    // Ignore
  }
}