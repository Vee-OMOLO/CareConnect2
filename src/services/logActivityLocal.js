// Local storage-based activity logging service
// Simple and reliable - no Supabase dependencies required

export function saveLocalActivity(linkKey, activityData) {
  try {
    // Get existing logs from localStorage
    const existing = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    
    // Create new activity log with local storage metadata
    const newActivity = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      link_key: linkKey,
      child_id: linkKey,
      caregiver_id: activityData.caregiverId || null,
      caregiver_email: activityData.caregiverEmail || null,
      activity_type: activityData.activityType || null,
      details: activityData.details || {},
      location: activityData.location || null,
      created_at: new Date().toISOString(),
      _local: true, // Mark as local storage entry
      _synced: false // Not yet synced to server
    };
    
    // Add to beginning of array
    const updated = [newActivity, ...existing];
    
    // Save back to localStorage
    localStorage.setItem('careconnect-activities', JSON.stringify(updated));
    
    return newActivity.id;
  } catch (error) {
    console.error('Error saving activity to local storage:', error);
    return null;
  }
}

export function getLocalActivities(linkKey) {
  try {
    const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    return activities.filter(activity => activity.link_key === linkKey);
  } catch (error) {
    console.error('Error loading local activities:', error);
    return [];
  }
}

export function cleanupLocalActivities(linkKey) {
  try {
    const activities = JSON.parse(localStorage.getItem('careconnect-activities') || '[]');
    const filtered = activities.filter(activity => activity.link_key !== linkKey);
    localStorage.setItem('careconnect-activities', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error cleaning up local activities:', error);
  }
}

export function cleanupOldLocalActivities(maxAgeDays = 30) {
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
    console.error('Error cleaning up local activities:', error);
  }
}

// --- Events (Calendar) ---

export function saveLocalEvent(linkKey, eventData) {
  try {
    const existing = JSON.parse(localStorage.getItem('careconnect-events') || '[]');
    
    const newEvent = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      link_key: linkKey,
      child_id: linkKey,
      title: eventData.title || null,
      type: eventData.type || null,
      date: eventData.date || null,
      notes: eventData.notes || null,
      caregiver_id: eventData.caregiverId || null,
      created_at: new Date().toISOString(),
      _local: true,
      _synced: false
    };
    
    const updated = [newEvent, ...existing];
    localStorage.setItem('careconnect-events', JSON.stringify(updated));
    return newEvent.id;
  } catch (error) {
    console.error('Error saving event to local storage:', error);
    return null;
  }
}

export function getLocalEvents(linkKey) {
  try {
    const events = JSON.parse(localStorage.getItem('careconnect-events') || '[]');
    return events.filter(event => event.link_key === linkKey);
  } catch (error) {
    console.error('Error loading local events:', error);
    return [];
  }
}