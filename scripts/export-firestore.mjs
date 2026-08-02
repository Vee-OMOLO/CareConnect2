#!/usr/bin/env node
// ============================================================================
// Export Firestore data → supabase/migration/export.json
//
// Requirements:
//   1. npm i -D firebase-admin
//   2. Firebase console → Project settings → Service accounts →
//      "Generate new private key" → save as scripts/service-account.json
//   3. node scripts/export-firestore.mjs
//
// (Alternative: with the Firebase CLI logged in you can run
//   npx firebase firestore:export ./supabase/migration --project kabu-ai-1d6cf
//  but that emits the raw emulator format — this script outputs clean JSON.)
// ============================================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { initializeApp, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = process.env.SERVICE_ACCOUNT || join(__dirname, 'service-account.json');
const outDir = join(__dirname, '..', 'supabase', 'migration');
const outFile = join(outDir, 'export.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  console.error(`Could not read service account at ${serviceAccountPath}.`);
  console.error('Generate one in Firebase console → Project settings → Service accounts → Generate new private key.');
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function getAll(docRef) {
  const snap = await docRef.get();
  const out = [];
  for (const d of snap.docs) {
    out.push({ id: d.id, ...d.data() });
  }
  return out;
}

const exportData = { users: [], activityLogs: [], sosAlerts: [], childEvents: [], caregiverLocations: [], emergencyContacts: [], notifications: [] };

try {
  exportData.users = await getAll(db.collection('users'));

  // activityLogs are stored as activityLogs/{linkKey}/logs subcollections
  const logParents = await getAll(db.collection('activityLogs'));
  for (const parent of logParents) {
    const logs = await getAll(db.collection('activityLogs', parent.id, 'logs'));
    exportData.activityLogs.push(...logs);
  }

  // emergencyContacts live under children/{linkKey}/emergencyContacts in old code,
  // and under a top-level emergencyContacts collection in the app UI
  try {
    exportData.emergencyContacts.push(...(await getAll(db.collection('emergencyContacts'))));
  } catch { /* collection may not exist */ }
  const children = await getAll(db.collection('children')).catch(() => []);
  for (const child of children) {
    try {
      exportData.emergencyContacts.push(...(await getAll(db.collection('children', child.id, 'emergencyContacts'))));
    } catch { /* no subcollection */ }
  }

  exportData.sosAlerts = await getAll(db.collection('sosAlerts')).catch(() => []);
  exportData.childEvents = await getAll(db.collection('child_events')).catch(() => []);
  exportData.caregiverLocations = await getAll(db.collection('caregiver_locations')).catch(() => []);
  exportData.notifications = await getAll(db.collection('notifications')).catch(() => []);

  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, JSON.stringify(exportData, null, 2), 'utf8');

  const counts = Object.entries(exportData).map(([k, v]) => `${k}: ${v.length}`);
  console.log(`Exported to ${outFile}\n${counts.join('\n')}`);
} finally {
  await deleteApp(app);
}
