import { supabase } from '../supabase';

// ============================================================================
// Supabase data layer for CareConnect.
// Auth and data both live on Supabase. RLS in supabase/schema.sql enforces
// per-family access. API mirrors the old firestoreService so callers only
// changed imports.
// ============================================================================

// Build the composite link key from parent email + child name
export function buildLinkKey(parentEmail, childName) {
  const email = (parentEmail || '').trim().toLowerCase();
  const name = (childName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${email}_${name}`;
}

// Find an existing family by parent email (returns the family row or null)
export async function findFamilyByParentEmail(parentEmail) {
  try {
    const email = (parentEmail || '').trim().toLowerCase();
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .ilike('parent_email', email)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.error('Error finding family by parent email:', e);
    return null;
  }
}

function mapRow(row) {
  return row ? { ...row, timestamp: row.created_at, createdAt: row.created_at } : row;
}

function mapRows(rows) {
  return (rows || []).map(mapRow);
}

// Log an activity
export async function logActivity(linkKey, activityData) {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        link_key: linkKey,
        child_id: linkKey,
        caregiver_id: activityData.caregiverId || null,
        caregiver_email: activityData.caregiverEmail || null,
        activity_type: activityData.activityType || null,
        details: activityData.details || {},
        location: activityData.location || null,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error('Error logging activity:', e);
    saveToOfflineQueue('activity', { linkKey, ...activityData });
    return null;
  }
}

// Subscribe to real-time activity logs (initial fetch + realtime refresh)
export function subscribeToActivities(linkKey, callback, onError) {
  let active = true;
  const sb = supabase;

  const load = async () => {
    try {
      const { data, error } = await sb
        .from('activity_logs')
        .select('*')
        .eq('link_key', linkKey)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (active) callback(mapRows(data));
    } catch (e) {
      console.error('Activity subscription error:', e);
      if (active && onError) onError(e);
    }
  };

  load();
  const channel = sb
    .channel(`activities-${linkKey}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs', filter: `link_key=eq.${linkKey}` }, load)
    .subscribe();

  const poll = setInterval(load, 30000);

  return () => {
    active = false;
    clearInterval(poll);
    sb.removeChannel(channel);
  };
}

// Create an emergency alert (sos_alerts row + a timeline entry)
export async function createEmergencyAlert(linkKey, location, caregiverId = 'unknown') {
  try {
    const { data, error } = await supabase
      .from('sos_alerts')
      .insert({
        link_key: linkKey,
        child_id: linkKey,
        caregiver_id: caregiverId,
        location: location || null,
        status: 'active',
      })
      .select('id')
      .single();
    if (error) throw error;

    // Also add to activity timeline
    await supabase.from('activity_logs').insert({
      link_key: linkKey,
      child_id: linkKey,
      caregiver_id: caregiverId,
      activity_type: 'sos',
      details: { option: 'Emergency SOS Triggered', notes: 'Location shared' },
      location: location || null,
    });

    return data.id;
  } catch (e) {
    console.error('Error creating emergency alert:', e);
    saveToOfflineQueue('sos', { linkKey, location, caregiverId });
    return null;
  }
}

// Add a calendar event
export async function addEvent(linkKey, eventData) {
  try {
    const { data, error } = await supabase
      .from('child_events')
      .insert({
        link_key: linkKey,
        child_id: linkKey,
        title: eventData.title || null,
        type: eventData.type || null,
        date: eventData.date || null,
        notes: eventData.notes || null,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch (e) {
    console.error('Error adding event:', e);
    saveToOfflineQueue('event', { linkKey, ...eventData });
    return null;
  }
}

// Subscribe to events (initial fetch + realtime refresh)
export function subscribeToEvents(linkKey, callback, onError) {
  let active = true;
  const sb = supabase;

  const load = async () => {
    try {
      const { data, error } = await sb
        .from('child_events')
        .select('*')
        .eq('link_key', linkKey)
        .order('date', { ascending: true });
      if (error) throw error;
      if (active) callback(mapRows(data));
    } catch (e) {
      console.error('Events subscription error:', e);
      if (active && onError) onError(e);
    }
  };

  load();
  const channel = sb
    .channel(`events-${linkKey}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'child_events', filter: `link_key=eq.${linkKey}` }, load)
    .subscribe();

  const poll = setInterval(load, 30000);

  return () => {
    active = false;
    clearInterval(poll);
    sb.removeChannel(channel);
  };
}

// Save caregiver location (upsert — one row per caregiver).
// link_key links the row to the family so the parent can read it back.
export async function saveCaregiverLocation(caregiverId, linkKey, location) {
  try {
    const { error } = await supabase
      .from('caregiver_locations')
      .upsert(
        {
          caregiver_id: caregiverId,
          link_key: linkKey || null,
          lat: location.lat,
          lng: location.lng,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'caregiver_id' }
      );
    if (error) throw error;
  } catch (e) {
    console.error('Error saving location:', e);
  }
}

// Subscribe to a caregiver's live location
export function subscribeToCaregiverLocation(caregiverId, callback) {
  let active = true;
  const sb = supabase;

  const load = async () => {
    try {
      const { data, error } = await sb
        .from('caregiver_locations')
        .select('*')
        .eq('caregiver_id', caregiverId)
        .single();
      if (error) throw error;
      if (active && data) callback(mapRow(data));
    } catch (e) {
      console.error('Caregiver location subscription error:', e);
    }
  };

  load();
  const channel = sb
    .channel(`loc-${caregiverId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_locations', filter: `caregiver_id=eq.${caregiverId}` }, load)
    .subscribe();

  return () => {
    active = false;
    sb.removeChannel(channel);
  };
}

// Parent: subscribe to the most recent caregiver location for the family.
// Caregivers write with link_key set; the parent reads by link_key.
export function subscribeToFamilyLocation(linkKey, callback) {
  let active = true;
  const sb = supabase;

  const load = async () => {
    try {
      const { data, error } = await sb
        .from('caregiver_locations')
        .select('*')
        .eq('link_key', linkKey)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (active && data) callback(mapRow(data));
    } catch (e) {
      console.error('Family location subscription error:', e);
    }
  };

  load();
  const channel = sb
    .channel(`family-loc-${linkKey}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_locations', filter: `link_key=eq.${linkKey}` }, load)
    .subscribe();

  const poll = setInterval(load, 30000);

  return () => {
    active = false;
    clearInterval(poll);
    sb.removeChannel(channel);
  };
}

// --- emergency contacts (cloud-synced) --------------------------------------

// Load emergency contacts for a family (falling back to a caregiver's local save)
export async function getEmergencyContacts(linkKey) {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('link_key', linkKey)
      .order('is_primary', { ascending: false });
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id,
      name: c.name || '',
      role: c.relationship || '',
      phone: c.phone || '',
      isPrimary: Boolean(c.is_primary),
    }));
  } catch (e) {
    console.error('Error loading contacts:', e);
    return null;
  }
}

// Replace the family's contact list with the given contacts (delete + insert)
export async function syncEmergencyContacts(linkKey, contacts) {
  try {
    const sb = supabase;
    const { error: delError } = await sb
      .from('emergency_contacts')
      .delete()
      .eq('link_key', linkKey);
    if (delError) throw delError;

    const rows = (contacts || [])
      .filter((c) => c && (c.name || c.phone))
      .map((c) => ({
        link_key: linkKey,
        child_id: linkKey,
        name: c.name || null,
        relationship: c.role || c.relationship || null,
        phone: c.phone || null,
        is_primary: Boolean(c.isPrimary),
      }));
    if (rows.length === 0) return;

    const { error: insError } = await sb.from('emergency_contacts').insert(rows);
    if (insError) throw insError;
  } catch (e) {
    console.error('Error syncing contacts:', e);
  }
}

// --- profiles / families -----------------------------------------------------

export async function getUserProfile(uid) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.error('Error loading profile:', e);
    return null;
  }
}

export async function saveUserProfile(uid, data) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: uid,
          email: data.email !== undefined ? data.email : null,
          name: data.name !== undefined ? data.name : null,
          role: data.role !== undefined ? data.role : null,
          child_name: data.childName !== undefined ? data.childName : null,
          parent_email: data.parentEmail !== undefined ? data.parentEmail : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    if (error) throw error;
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

// Create/update the family row and add the user as a member.
// Deep-link logic: always look up the parent's family by email first.
// If the parent already has a family, the caregiver joins THAT family
// (using the parent's child_name) so both users share the same linkKey.
//
// RLS note: non-members can't UPDATE an existing family row, so the family
// upsert uses ON CONFLICT DO NOTHING (ignoreDuplicates). Creating a family
// is an INSERT; joining an existing one never touches the existing row.
export async function ensureFamily(linkKey, { userUid, role, childName, parentEmail }) {
  try {
    const sb = supabase;
    const email = (parentEmail || '').trim().toLowerCase();

    // Step 1: Check if the parent already has a family by email
    let existing = null;
    try {
      const { data } = await sb
        .from('families')
        .select('*')
        .ilike('parent_email', email)
        .limit(1)
        .maybeSingle();
      existing = data;
    } catch (e) {
      // Non-member lookups may be blocked by RLS without the lookup policy;
      // fall through and rely on exact child_name matching instead.
      console.warn('Family lookup unavailable:', e?.message);
    }

    // Step 2: If parent's family exists, always use its child_name (canonical source)
    let finalChildName = childName;
    let finalLinkKey = linkKey;
    if (existing?.child_name) {
      finalChildName = existing.child_name;
      finalLinkKey = buildLinkKey(email, existing.child_name);
    }

    // Step 3: Upsert the family with the canonical child_name.
    // ignoreDuplicates = ON CONFLICT DO NOTHING: joining an existing family
    // is a no-op here (no UPDATE policy needed); creating is a plain INSERT.
    const { error: famError } = await sb
      .from('families')
      .upsert(
        {
          link_key: finalLinkKey,
          child_name: finalChildName || null,
          parent_email: email || null,
          parent_uid: role === 'parent' ? userUid : (existing?.parent_uid || null),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'link_key', ignoreDuplicates: true }
      );
    if (famError) throw famError;

    // Step 4: Add this user as a family member (insert only — no update policy needed)
    const { error: memError } = await sb
      .from('family_members')
      .upsert(
        { link_key: finalLinkKey, user_uid: userUid, role: role || null },
        { onConflict: 'link_key,user_uid', ignoreDuplicates: true }
      );
    if (memError) throw memError;

    return finalLinkKey;
  } catch (e) {
    console.error('Error ensuring family:', e);
    return null;
  }
}

export async function removeFamilyMembership(linkKey, userUid) {
  try {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('link_key', linkKey)
      .eq('user_uid', userUid);
    if (error) throw error;
  } catch (e) {
    console.error('Error removing family membership:', e);
  }
}

// --- notifications -----------------------------------------------------------

export async function sendNotification(linkKey, { type, title, body, priority } = {}) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        link_key: linkKey,
        type: type || 'activity',
        title: title || 'Update',
        body: body || '',
        priority: priority || null,
      });
    if (error) throw error;
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}

// --- offline queue -----------------------------------------------------------

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

    // Only drop an item after it ACTUALLY succeeded — a failed write (offline,
    // denied rules, etc.) must stay queued for the next retry instead of being
    // silently erased.
    const remaining = [];
    for (const item of queue) {
      let ok = false;
      try {
        switch (item.type) {
          case 'activity':
            if (await logActivity(item.data.linkKey, item.data)) ok = true;
            break;
          case 'sos':
            if (await createEmergencyAlert(item.data.linkKey, item.data.location, item.data.caregiverId)) ok = true;
            break;
          case 'event':
            if (await addEvent(item.data.linkKey, item.data)) ok = true;
            break;
          default:
            ok = true; // unknown item types are dropped without retrying
        }
      } catch (e) {
        console.error('Offline queue item failed:', e);
      }
      if (!ok) remaining.push(item);
    }

    localStorage.setItem('careconnect-offline-queue', JSON.stringify(remaining));
  } catch (e) {
    console.error('Error processing offline queue:', e);
  }
}
