import { createClient } from '@supabase/supabase-js';

// Config is env-driven (VITE_SUPABASE_*) with committed fallbacks so the app
// keeps working out of the box. Override via .env.local for other projects.
// NOTE: only the ANON key may live in the frontend bundle. The service_role
// key is a secret and must never be referenced here.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://atbpgmoooxpchphixagc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0YnBnbW9vb3hwY2hwaGl4YWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzA2MTgsImV4cCI6MjEwMTAwNjYxOH0.-S5j9a2g8AcSc2jpAnzbD_fVBPIafcS1l4wahAyOKDI';

// Supabase is now the single backend: auth + data. Session is persisted by
// supabase-js automatically and the access token is sent on every request;
// RLS policies (supabase/schema.sql) resolve the caller via auth.uid().
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
