import { createClient } from '@supabase/supabase-js';

// Config is env-driven (VITE_SUPABASE_*) with committed fallbacks so the app
// keeps working out of the box. Override via .env.local for other projects.
// NOTE: only the ANON key may live in the frontend bundle. The service_role
// key is a secret and must never be referenced here.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://atbpgmoooxpchphixagc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBnbW9vb3hwY2hwaGl4YWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzA2MTgsImV4cCI6MjEwMTAwNjYxOH0.-S5j9a2g8AcSc2jpAnzbD_fVBPIafcS1l4wahAyOKDI';

// Auth stays on Firebase, so we create the Supabase client per signed-in
// Firebase user and pass their UID as the "x-firebase-uid" header. RLS
// policies (supabase/schema.sql) resolve the caller from that header.
let supabaseClient = null;

export function initSupabase(firebaseUid) {
  const uid = firebaseUid || null;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { 'x-firebase-uid': uid || '' },
    },
    realtime: {
      headers: { 'x-firebase-uid': uid || '' },
    },
  });
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) initSupabase(null);
  return supabaseClient;
}
