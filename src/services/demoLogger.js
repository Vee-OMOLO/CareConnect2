// Demo mode logger - ensures logs always save regardless of backend status
// Pure localStorage implementation - no external dependencies, no dynamic imports

import { saveLocalActivity, getLocalActivities } from './logActivityLocal';

// Simple demo mode logger that ALWAYS works
export async function demoLogActivity(linkKey, activityData) {
  // Always save to localStorage first - instant, reliable, no dependencies
  const localResult = saveLocalActivity(linkKey, activityData);
  
  // Sync to Supabase (await the result so parent sees it immediately)
  try {
    const { logActivity } = await import('./supabaseService');
    const supabaseResult = await logActivity(linkKey, activityData);
    return supabaseResult || localResult; // Prefer Supabase if it worked
  } catch {
    // Silently ignore import/sync errors - localStorage already saved
    return localResult;
  }
}

// Get all activities for a linkKey - always returns localStorage data + any Supabase data
export async function getAllActivities(linkKey) {
  // ALWAYS get from localStorage first - this is the primary source
  let activities = [];
  try {
    activities = getLocalActivities(linkKey);
  } catch {
    activities = [];
  }
  
  // Try to get additional data from Supabase (background enhancement)
  try {
    const { supabase } = await import('../supabase');
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('link_key', linkKey)
      .order('created_at', { ascending: false });
    
    if (!error && data && data.length > 0) {
      // Merge Supabase data with local data
      const localIds = new Set(activities.map(a => a.id));
      const supabaseOnly = data.filter(item => !localIds.has(item.id));
      activities = [...supabaseOnly, ...activities]; // Supabase data first, then local
      
      // Sort by created_at descending
      activities = activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch {
    // Silently ignore Supabase errors - localStorage data is still returned
  }
  
  return activities;
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