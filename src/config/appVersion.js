// Single source of truth for the app version shown in the UI and used for
// update detection. Keep in sync with package.json and public/version.json.
export const APP_VERSION = '1.1.0';

// Changelog shown once per version in the "What's New" sheet.
// Each entry: { icon, title, description }
export const CHANGELOG = {
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
