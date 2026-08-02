// Single source of truth for the app version shown in the UI and used for
// update detection. Keep in sync with package.json and public/version.json.
export const APP_VERSION = '1.2.0';

// Changelog shown once per version in the "What's New" sheet.
// Each entry: { icon, title, description }
export const CHANGELOG = {
  '1.2.0': [
    {
      icon: 'database',
      title: 'Everything now runs on Supabase',
      description: 'Accounts, activity logs, alerts, and locations all live in one secure Postgres database — faster and simpler than before.',
    },
    {
      icon: 'verified_user',
      title: 'One login for the whole family',
      description: 'Sign-in and sign-up are handled by Supabase Auth with email confirmation. Existing accounts keep their data.',
    },
    {
      icon: 'cloud_sync',
      title: 'Sync blockers are gone',
      description: 'The old Firestore rules that silently blocked saving are gone — real-time family sharing now just works.',
    },
  ],
  '1.1.1': [
    {
      icon: 'cloud_sync',
      title: 'Saved offline — now it really syncs',
      description: 'Fixed a bug where logs saved offline were being lost instead of syncing. Anything queued is now retried until it lands in the family timeline.',
    },
    {
      icon: 'cloud_off',
      title: 'Dashboards explain connection issues',
      description: "If logs can't load, you'll see a clear message with a Retry button instead of a misleading empty timeline.",
    },
  ],
  '1.1.0': [
    {
      icon: 'unlock',
      title: 'No more getting stuck after setup',
      description: 'Choosing your role now works instantly, even with a slow or blocked connection.',
    },
    {
      icon: 'family_restroom',
      title: 'Caregivers link families from the dashboard',
      description: 'Set up is now just "who are you?". Connect to a parent and child anytime from a dedicated Link Family page.',
    },
    {
      icon: 'notifications_active',
      title: 'Parents get notified when you log activity',
      description: 'Every feeding, medicine, or check-in now sends an instant update to the linked parent.',
    },
    {
      icon: 'location_on',
      title: 'Live GPS tracking now really works',
      description: 'Your live location is saved and shared with the linked family in real time.',
    },
    {
      icon: 'calendar_month',
      title: 'Calendar shows real events',
      description: 'Scheduled appointments and reminders now stream from the family calendar, not sample data.',
    },
    {
      icon: 'emergency',
      title: 'Smarter emergency alerts',
      description: 'Alerts attach your real account and call your primary emergency contact instead of a fixed number.',
    },
    {
      icon: 'cloud_sync',
      title: 'Offline-first sync',
      description: 'Logs, alerts, and events saved offline automatically sync to the family when you reconnect.',
    },
  ],
};
