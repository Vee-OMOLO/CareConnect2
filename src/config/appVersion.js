// Single source of truth for the app version shown in the UI and used for
// update detection. Keep in sync with package.json and public/version.json.
export const APP_VERSION = '1.3.0';

// Changelog shown once per version in the "What's New" sheet.
// Each entry: { icon, title, description }
export const CHANGELOG = {
  '1.3.0': [
    {
      icon: 'verified_user',
      title: 'Clear sign-in, all the way through',
      description: 'Login now explains every situation — unconfirmed email, wrong password, unknown account — and you can reset a forgotten password right from the sign-in screen.',
    },
    {
      icon: 'family_restroom',
      title: 'Joining a family now actually works',
      description: 'Caregivers can find and join the parent\u2019s family without hitting permission errors, so shared logs, alerts, and events sync between both accounts.',
    },
    {
      icon: 'live_tv',
      title: 'Live data, no refresh needed',
      description: 'Dashboards and the calendar now refresh automatically, so a new log from the caregiver shows up on the parent\u2019s screen within seconds.',
    },
    {
      icon: 'location_on',
      title: 'GPS tracking fixed — parents see the caregiver',
      description: 'Caregivers share their live location to the linked family; parents now watch the caregiver\u2019s position instead of their own.',
    },
    {
      icon: 'calendar_month',
      title: 'Caregivers get the calendar',
      description: 'The caregiver app finally links to the family calendar for viewing and adding events.',
    },
    {
      icon: 'shield',
      title: 'Safety Vault contacts sync to the cloud',
      description: 'Emergency contacts are shared with the linked family and survive device switches instead of living only on one phone.',
    },
    {
      icon: 'account_circle',
      title: 'Edit Profile actually saves',
      description: 'Your name and phone now save for real, and switching accounts never leaks one person\u2019s family into another\u2019s session.',
    },
    {
      icon: 'add_a_photo',
      title: 'Photos work without extra setup',
      description: 'If Cloudinary isn\u2019t configured, photos are still attached to logs by compressing them on your device.',
    },
  ],
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
