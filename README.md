# HabitPulse - Mobile-First Local-First PWA Habit Tracker with Supabase Sync

HabitPulse is a minimalist, privacy-first, offline-first Progressive Web App (PWA) built with **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**. It helps you build consistent daily habits, track unbroken streaks, and gain clarity with 90-day activity heatmaps.

---

## ✨ Local-First & Supabase Architecture

1. **Local-First Speed**: All user changes (checking habits, adding habits, changing categories, updating profile) save **instantly** to local IndexedDB (`src/storage/db.ts`). The UI never waits for network calls or database servers.
2. **Offline-First Synchronization**: Operations performed offline are queued in IndexedDB (`sync_queue`). When connectivity returns, `SyncManager` automatically drains the queue up to Supabase.
3. **Supabase PostgreSQL & Auth**:
   - Optional Cloud Authentication (Email/Password Sign Up and Sign In).
   - PostgreSQL database with Row Level Security (RLS) guaranteeing data ownership.
   - Automatic migration prompt when creating an account on a device with pre-existing local habit records.

---

## 🔒 Supabase Setup Instructions

### 1. Database Schema Execution
Copy and execute the SQL contained in `supabase/schema.sql` inside your **Supabase Project Dashboard -> SQL Editor**:

1. Log into your Supabase Dashboard at [supabase.com](https://supabase.com).
2. Open your project (or create a new one).
3. Navigate to **SQL Editor** -> **New Query**.
4. Paste the entire content of `supabase/schema.sql`.
5. Click **Run**.

This creates the following tables with **Row Level Security (RLS)** enabled:
- `public.profiles`
- `public.categories`
- `public.habits`
- `public.habit_completions`
- `public.user_settings`

### 2. Environment Variables
Create a `.env` file in the root directory (or update `.env.example`):

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*Note: You can obtain these keys from your Supabase Dashboard under **Project Settings -> API**.*

---

## 🚀 Setup & Development

### Prerequisites
- Node.js 18+ and npm installed.

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production / GitHub Pages

```bash
# Build production bundle and service worker
npm run build
```

Production builds use `base: '/HabitPulse/'` automatically for GitHub Pages deployment (`https://cat7890-sys.github.io/HabitPulse/`).

---

## 📁 Code Structure

```
├── public/                 # PWA icons, manifest assets, and favicons
├── supabase/               # PostgreSQL schema & RLS policies
│   └── schema.sql
├── src/
│   ├── auth/               # AuthContext & useAuth hook
│   ├── sync/               # SyncManager & SyncQueue offline-first queue
│   ├── storage/            # IndexedDB local storage engine & storage wrapper
│   ├── lib/                # Supabase client initializer
│   ├── components/
│   │   ├── auth/           # AuthModal, DataMigrationModal
│   │   ├── common/         # SyncStatusBadge, ColorMap, PWAInstallButton
│   │   ├── habits/         # HabitListScreen, HabitFormModal, CategoryManagerModal
│   │   ├── layout/         # Header, BottomNav
│   │   ├── settings/       # SettingsScreen
│   │   ├── stats/          # StatsScreen, Heatmap90Days, WeeklyChart
│   │   └── today/          # TodayScreen, ProgressRing, DateSelector, HabitCard
│   ├── hooks/              # useHabits, usePWAInstall, useOnlineStatus
│   ├── types/              # TypeScript interfaces and data models
│   ├── utils/              # date.ts, streaks.ts, sound.ts, notifications.ts
│   ├── App.tsx             # Root orchestrator
│   └── main.tsx            # Application entry point with AuthProvider & ErrorBoundary
├── vite.config.ts          # Vite & VitePWA configuration
└── tsconfig.json           # TypeScript configuration
```
