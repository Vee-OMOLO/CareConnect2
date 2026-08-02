#!/usr/bin/env node
// ============================================================================
// Import supabase/migration/export.json → Supabase Postgres
//
// The service_role key is a SECRET — it is read from the environment or the
// GIT.txt on the Desktop, never from the committed code.
//
// Usage:
//   $env:SUPABASE_SERVICE_ROLE="<service role key>" ; node scripts/import-supabase.mjs
//   (or: node scripts/import-supabase.mjs --key <service role key>)
//
// Run AFTER supabase/schema.sql has been executed in the Supabase SQL Editor.
// ============================================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exportFile = join(__dirname, '..', 'supabase', 'migration', 'export.json');

const URL = process.env.SUPABASE_URL || 'https://atbpgmoooxpchphixagc.supabase.co';
const keyIdx = process.argv.indexOf('--key');
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || (keyIdx >= 0 ? process.argv[keyIdx + 1] : '');

if (!SERVICE_ROLE) {
  console.error('Missing service role key. Pass it via SUPABASE_SERVICE_ROLE env var or --key <key>.');
  process.exit(1);
}

let exportData;
try {
  exportData = JSON.parse(readFileSync(exportFile, 'utf8'));
} catch {
  console.error(`Could not read ${exportFile}. Run scripts/export-firestore.mjs first.`);
  process.exit(1);
}

// Service role bypasses RLS — local script only.
const sb = createClient(URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

function ts(v) {
  // Convert Firestore Timestamp-like { _seconds, _nanoseconds } / { seconds } → ISO
  if (!v) return null;
  if (typeof v === 'object') {
    const secs = v._seconds ?? v.seconds;
    if (secs != null) return new Date(secs * 1000).toISOString();
    if (v._nanoseconds != null) return new Date(v._nanoseconds / 1e6).toISOString();
    if (v.toDate) return v.toDate().toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  return v;
}

async function insertAll(table, rows, mapper) {
  if (!rows.length) return;
  const mapped = rows.map(mapper);
  const { error } = await sb.from(table).upsert(mapped, { ignoreDuplicates: true });
  if (error) {
    console.error(`Failed importing ${table}:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`Imported ${mapped.length} rows into ${table}`);
  }
}

// Build families + members from users/profiles
const seenFamilies = new Map();
const familyMembers = [];
for (const u of exportData.users) {
  const email = (u.email || '').toLowerCase();
  const childName = u.childName || u.child_name || '';
  const role = u.role || 'caregiver';
  const parentEmail = (u.parentEmail || u.parent_email || '').toLowerCase() || email;
  if (childName && parentEmail) {
    const linkKey = `${parentEmail}_${childName.trim().toLowerCase().replace(/\s+/g, ' ')}`;
    if (!seenFamilies.has(linkKey)) {
      seenFamilies.set(linkKey, {
        link_key: linkKey,
        parent_uid: role === 'parent' ? u.id : null,
        child_name: childName,
        parent_email: parentEmail,
      });
    }
    familyMembers.push({ link_key: linkKey, user_uid: u.id, role });
  }
}

await insertAll('profiles', exportData.users, (u) => ({
  user_uid: u.id,
  email: u.email || null,
  name: u.name || u.displayName || null,
  role: u.role || null,
  child_name: u.childName || u.child_name || null,
  parent_email: u.parentEmail || u.parent_email || null,
  created_at: ts(u.createdAt) || ts(u.created_at) || undefined,
}));

await insertAll('families', [...seenFamilies.values()], (f) => f);
await insertAll('family_members', familyMembers, (m) => m);
await insertAll('activity_logs', exportData.activityLogs, (a) => ({
  link_key: a.linkKey || a.childId || a.link_key || '',
  child_id: a.childId || a.child_id || a.linkKey || a.link_key || null,
  caregiver_id: a.caregiverId || a.caregiver_id || null,
  caregiver_email: a.caregiverEmail || a.caregiver_email || null,
  activity_type: a.activityType || a.activity_type || null,
  details: a.details || {},
  location: a.location || null,
  created_at: ts(a.createdAt) || ts(a.timestamp) || ts(a.created_at) || undefined,
}));
await insertAll('sos_alerts', exportData.sosAlerts, (s) => ({
  link_key: s.childId || s.linkKey || s.link_key || '',
  child_id: s.childId || s.child_id || s.linkKey || s.link_key || null,
  caregiver_id: s.caregiverId || s.caregiver_id || null,
  location: s.location || null,
  status: s.status || 'active',
  created_at: ts(s.createdAt) || ts(s.timestamp) || ts(s.created_at) || undefined,
}));
await insertAll('child_events', exportData.childEvents, (e) => ({
  link_key: e.childId || e.linkKey || e.link_key || '',
  child_id: e.childId || e.child_id || e.linkKey || e.link_key || null,
  title: e.title || null,
  type: e.type || null,
  date: ts(e.date) || undefined,
  notes: e.notes || null,
  created_at: ts(e.createdAt) || ts(e.created_at) || undefined,
}));
await insertAll('caregiver_locations', exportData.caregiverLocations, (l) => ({
  caregiver_id: l.caregiverId || l.caregiver_id || l.id,
  link_key: l.linkKey || l.link_key || l.childId || null,
  lat: l.lat ?? l.location?.lat ?? null,
  lng: l.lng ?? l.location?.lng ?? null,
  updated_at: ts(l.updatedAt) || ts(l.timestamp) || ts(l.updated_at) || undefined,
}));
await insertAll('emergency_contacts', exportData.emergencyContacts, (c) => ({
  link_key: c.childId || c.linkKey || c.link_key || '',
  child_id: c.childId || c.child_id || c.linkKey || c.link_key || null,
  name: c.name || null,
  relationship: c.role || c.relationship || null,
  phone: c.phone || null,
  is_primary: Boolean(c.isPrimary || c.is_primary),
  created_at: ts(c.createdAt) || ts(c.created_at) || undefined,
}));
await insertAll('notifications', exportData.notifications, (n) => ({
  link_key: n.childId || n.linkKey || n.link_key || '',
  type: n.type || null,
  title: n.title || null,
  body: n.body || null,
  read: Boolean(n.read),
  priority: n.priority || null,
  created_at: ts(n.createdAt) || ts(n.timestamp) || ts(n.created_at) || undefined,
}));

console.log(process.exitCode ? 'Import finished with errors.' : 'Import complete.');
