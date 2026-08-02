// Demo mode logger - ensures logs always save regardless of backend status
// Uses STATIC imports for reliability (no dynamic import issues)

import { saveLocalActivity, getLocalActivities, saveLocalEvent, getLocalEvents } from './logActivityLocal';
import { logActivity, addEvent } from './supabaseService';
import { supabase } from '../supabase';

// Simple demo mode logger that ALWAYS works
export async function demoLogActivity(linkKey, activityData) {
  // Always save to localStorage first - instant, reliable, no dependencies
  const localResult = saveLocalActivity(linkKey, activityData);
  
  // Sync to Supabase - AWAIT the result so parent sees it immediately
  try {
    const supabaseResult = await logActivity(linkKey, activityData);
    return supabaseResult || localResult; // Prefer Supabase if it worked
  } catch {
    // Silently ignore Supabase errors - localStorage already saved
    return localResult;
  }
}

// Deduplicate activities by checking content similarity (not just ID)
function deduplicateActivities(activities) {
  const seen = new Set();
  return activities.filter(activity => {
    // Create a key based on content (not ID since local/Supabase IDs differ)
    const key = `${activity.link_key}-${activity.activity_type}-${activity.caregiver_id}-${new Date(activity.created_at).toISOString().slice(0, 16)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Get all activities for a linkKey - deduplicated, sorted by newest first
export async function getAllActivities(linkKey) {
  // Try Supabase first (shared between devices)
  let supabaseActivities = [];
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('link_key', linkKey)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      supabaseActivities = data;
    }
  } catch {
    // Silently ignore Supabase errors
  }
  
  // Get local activities (for offline access)
  let localActivities = [];
  try {
    localActivities = getLocalActivities(linkKey);
  } catch {
    localActivities = [];
  }
  
  // Merge: Supabase data first, then local (filtering out duplicates from Supabase)
  const localIds = new Set(supabaseActivities.map(a => a.id));
  const localOnly = localActivities.filter(a => !localIds.has(a.id));
  let activities = [...supabaseActivities, ...localOnly];
  
  // Deduplicate and sort by created_at descending
  activities = deduplicateActivities(activities);
  activities = activities.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return activities;
}

// Add an event to calendar (local storage + Supabase)
export async function addLocalEvent(linkKey, eventData) {
  // Save to localStorage first
  const localResult = saveLocalEvent(linkKey, eventData);
  
  // Sync to Supabase
  try {
    const supabaseResult = await addEvent(linkKey, {
      title: eventData.title,
      type: eventData.type,
      date: eventData.date,
      notes: eventData.notes,
    });
    return supabaseResult || localResult;
  } catch {
    return localResult;
  }
}

// Get all events for a linkKey (calendar events shared between devices)
export async function getAllEvents(linkKey) {
  // Try Supabase first
  let supabaseEvents = [];
  try {
    const { data, error } = await supabase
      .from('child_events')
      .select('*')
      .eq('link_key', linkKey)
      .order('date', { ascending: true });
    
    if (!error && data) {
      supabaseEvents = data;
    }
  } catch {
    // Silently ignore
  }
  
  // Get local events
  let localEvents = [];
  try {
    localEvents = getLocalEvents(linkKey);
  } catch {
    localEvents = [];
  }
  
  // Merge and deduplicate
  const localIds = new Set(supabaseEvents.map(e => e.id));
  const localOnly = localEvents.filter(e => !localIds.has(e.id));
  let events = [...supabaseEvents, ...localOnly];
  
  events = events.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  return events;
}

// Sync function - tries to push local activities to Supabase
export async function syncLocalActivities(linkKey) {
  try {
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
        activity._synced = true;
        syncedCount++;
      } catch {
        // Ignore individual sync failures
      }
    }
    
    if (syncedCount > 0) {
      const allActivities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
      localStorage.setItem('careconnect-activities', JSON.stringify(allActivities));
    }
    
    return syncedCount > 0;
  } catch {
    return false;
  }
}

// Get all emergency alerts for a linkKey (shared between devices)
export async function getEmergencyAlerts(linkKey) {
  let supabaseAlerts = [];
  try {
    const { data, error } = await supabase
      .from('sos_alerts')
      .select('*')
      .eq('link_key', linkKey)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      supabaseAlerts = data;
    }
  } catch {
    // Silently ignore Supabase errors
  }
  
  return supabaseAlerts;
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