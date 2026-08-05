<div align="center">

# 🩺 CareConnect

**Real-time care coordination for parents & caregivers**

---

<p>
<a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"></a>
<a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
<a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"></a>
<a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
<a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4-06B4D6?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"></a>
<a href="https://leafletjs.com"><img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet"></a>
</p>

<p>
<a href="#license"><img src="https://img.shields.io/badge/version-1.3.0-blue?style=flat-square" alt="Version"></a>
<a href="#license"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"></a>
<a href="#contributing"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome"></a>
</p>

---

### 🚀 Live Demo & Source Code

<p>
<a href="https://zip-chi-rust.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-%F0%9F%8C%90-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo"></a>
<a href="https://github.com/Vee-OMOLO/CareConnect2"><img src="https://img.shields.io/badge/Source_Code-%F0%9F%93%A6-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source Code"></a>
</p>

</div>

---

## Overview

CareConnect bridges the gap between parents and caregivers with a real-time platform for activity logging, location tracking, emergency alerts, and care coordination — all in a clean, mobile-first interface.

---

## Features

| Category | Capabilities |
|----------|-------------|
| **👤 Dual Role System** | Parent dashboard with daily summaries · Caregiver view for quick logging · Role-specific navigation |
| **🔗 Family Linking** | Parent sets the child's name · Caregiver links via parent email + child name · Shared `link_key` for all records |
| **📝 Activity Tracking** | Log meals, naps, diaper changes, medication & more · Real-time sync to parent view · Color-coded timeline |
| **📍 Live Location** | GPS tracking with Leaflet maps · Share location with family · Watch live position updates |
| **🚨 Emergency SOS** | One-tap alert · Auto-shares GPS location · Emergency type selection (Medical, Fire, Missing Child, Injury, Allergic Reaction, Choking) |
| **📅 Smart Calendar** | Monthly calendar view · Appointment & medication reminders · Upcoming events list |
| **🛡️ Safety Vault** | Emergency contacts · Medical info (blood type, allergies, conditions, medications) · Cloud-synced across devices · Quick access to SOS |
| **🔐 Auth & Roles** | Supabase Auth · Email/password sign-in · Role selection on first launch |
| **📱 Mobile-First** | Bottom navigation · PWA-ready · Touch-optimized UI · Smooth animations · Android via Capacitor |

---

## Tech Stack

<div align="center">

| Frontend | Backend | Infrastructure |
|----------|---------|---------------|
| React 19 | Supabase Auth | Vite 8 |
| TypeScript 5.8 | Supabase Postgres + RLS | Vercel |
| Tailwind CSS 4 | Cloudinary | Capacitor (Android) |
| Framer Motion | Geolocation API | PWA |
| Leaflet + React-Leaflet | supabase-js + Realtime | |

</div>

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase project (Auth + Postgres with Row Level Security)
- A Cloudinary account (for media uploads)

### Installation

```bash
git clone https://github.com/Vee-OMOLO/CareConnect2.git
cd CareConnect2
npm install
```

### Environment Variables

Create `.env.local` from `.env.example`:

```env
# Supabase config — auth + data (project Settings > API)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Cloudinary config — for photo uploads
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

> **Database setup:** apply the schema, RLS policies, and Realtime publication
> from `supabase/schema.sql` in the Supabase SQL Editor before first run.

### Run

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # Lint with oxlint
```

---

## Project Structure

```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Routes & auth guards
├── supabase.js               # Supabase client (URL + anon key)
├── index.css                 # Global styles
├── config/
│   └── appVersion.js         # App version for update banner
├── contexts/
│   └── AuthContext.jsx       # Auth state, roles, linking, per-user sessions
├── services/
│   ├── supabaseService.js    # Families, members, activities, SOS, contacts, events, location, realtime
│   ├── locationService.js    # Geolocation helpers
│   ├── cloudinaryService.js  # Photo upload with local fallback
│   ├── notificationService.js# Local notifications
│   ├── logActivityLocal.js   # Offline activity logging
│   └── demoLogger.js         # Demo data generation
├── components/
│   ├── BottomNav.jsx         # Mobile bottom nav
│   ├── PageHeader.jsx        # Page header with back
│   ├── ActivityChip.jsx      # Activity type chip
│   ├── Toggle.jsx            # Toggle switch
│   ├── EmergencyDashboard.jsx# SOS alert system
│   ├── EmptyState.jsx        # Empty state placeholder
│   ├── OfflineBanner.jsx     # Offline indicator
│   ├── UpdateBanner.jsx      # New version prompt
│   ├── WhatsNewSheet.jsx     # Changelog sheet
│   └── ErrorBoundary.jsx     # Error boundary
├── constants/
│   └── activityData.js       # Activity types & colors
├── utils/
│   └── updateManager.js      # Version check + cache clearing
└── pages/
    ├── Login.jsx             # Sign in
    ├── Register.jsx          # Create account
    ├── RoleSelection.jsx     # Choose parent/caregiver
    ├── LinkFamily.jsx        # Link family by email + child name
    ├── ParentHome.jsx        # Parent dashboard
    ├── CaregiverHome.jsx     # Caregiver dashboard
    ├── LogActivity.jsx       # Log a care activity
    ├── Calendar.jsx          # Schedule calendar
    ├── TrackingMap.jsx       # Live GPS tracking
    ├── SafetyVault.jsx       # Emergency contacts & info
    └── Profile.jsx           # User profile & settings
```

---

## API & Services

| Service | File | Purpose |
|---------|------|---------|
| Supabase | `supabaseService.js` | Family linking, activities, SOS, contacts, events, locations, realtime subscriptions |
| Location | `locationService.js` | GPS position, watchPosition, start/stop live tracking |
| Media | `cloudinaryService.js` | Photo upload (with local data-URL fallback) |
| Auth | `AuthContext.jsx` | Login, register, logout, role management, family linking, per-user session state |

---

## Database & Security

- **Supabase Postgres** with tables for `profiles`, `families`, `family_members`, `activity_logs`, `sos_alerts`, `child_events`, `caregiver_locations`, `emergency_contacts`, and `notifications`.
- **Row Level Security** enforces per-family access: the `is_family_member(link_key)` function gates every shared record, so caregivers can only read/write families they belong to (see `supabase/schema.sql`).
- **Family linking** is derived from a deterministic `link_key` (`parentEmail_childName`), so parent and caregiver end up on the same family without exchanging codes.
- **Supabase Auth** with email/password; roles selected on first launch.
- Environment variables for all secrets.

---

## Contributing

<a href="#contributing"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge" alt="PRs Welcome"></a>

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a PR

---

## License

MIT © [Vee Omolo](https://github.com/Vee-OMOLO)

---

<div align="center">

<p>
<a href="https://github.com/Vee-OMOLO/CareConnect2"><img src="https://img.shields.io/github/stars/Vee-OMOLO/CareConnect2?style=flat-square&color=yellow" alt="GitHub Stars"></a>
<a href="https://github.com/Vee-OMOLO/CareConnect2"><img src="https://img.shields.io/github/forks/Vee-OMOLO/CareConnect2?style=flat-square" alt="GitHub Forks"></a>
<a href="https://github.com/Vee-OMOLO/CareConnect2/issues"><img src="https://img.shields.io/github/issues/Vee-OMOLO/CareConnect2?style=flat-square&color=red" alt="GitHub Issues"></a>
</p>

**⭐ Star this repo if you find it useful!**

</div>
