# HabitPulse - Mobile-First PWA Habit Tracker

HabitPulse is a minimalist, privacy-first, offline Progressive Web App (PWA) built with **React**, **TypeScript**, and **Tailwind CSS**. It helps you build consistent daily habits, track unbroken streaks, and gain clarity with 90-day activity heatmaps.

---

## ✨ Features

1. **Today Screen**:
   - One-tap check-off for today's scheduled habits with micro-haptics and audio feedback.
   - Interactive animated progress ring showing percentage completed.
   - Live current streak badge next to each habit.
   - Horizontal date slider and **Full Monthly Date Picker** to navigate and back-fill past days (retroactive logging).
   - Contextual retroactive entry banner with instant "Return to Today" action.
   - 100% daily goal completion confetti celebration.

2. **Habit & Category Management**:
   - Search bar with clear button for finding habits across names and categories.
   - **Multi-criteria Sorting Dropdown**: Sort by Current Streak (🔥), Best Streak (🏆), Name (A-Z / Z-A), Completion Rate (%), and Creation Date (Newest / Oldest).
   - Custom color-coded categories (e.g., Health, Work, Personal, Mind, Fitness) with custom emojis and accent colors.
   - Category Manager to create, edit, customize colors/icons, and delete categories.
   - Visual category grouping in HabitListScreen with stylized group headers and category filter badges.
   - Custom emoji icons with curated presets.
   - Color theming (Indigo, Violet, Rose, Emerald, Amber, Cyan, Blue, Orange).
   - Flexible frequencies:
     - **Daily**: Every day.
     - **Specific Weekdays**: Custom days (e.g. Mon, Wed, Fri).
     - **X Times / Week**: Flexible target (e.g. 3x per week) with live weekly dot progress indicators.
   - Optional time-based reminders.

3. **Streak & Metric Engine**:
   - Current streak and all-time best streak calculations per habit.
   - Missed scheduled days reset the streak.
   - Weekdays and X-times/week habits calculate streaks based on scheduled periods without penalizing unscheduled off-days.
   - Overall completion rate percentage based on scheduled days since creation.

4. **Stats & Visualizations**:
   - **Weekly Goal Progress Widget**: Category-by-category bar chart comparing current weekly check-in totals against user-defined weekly targets (Monday through Sunday) with celebration status and per-habit breakdowns.
   - **90-Day Calendar Heatmap**: GitHub-style activity grid with interactive tooltips and intensity levels.
   - **7-Day Performance Chart**: Daily completion trends and averages.
   - **KPI Summary**: Total lifetime check-ins, record streaks, and active habit counts.

5. **Browser Reminders**:
   - Polite browser Notification API permissions.
   - Periodic reminder checks that trigger notifications at your set habit times.
   - Built-in test notification button in Settings.

6. **Settings & Tactile Feedback**:
   - Web Vibration API integration: Crisp physical haptic patterns for habit completion (`[18ms, 45ms, 28ms]`), unchecking (`10ms`), and daily goal celebrations (`[30ms, 50ms, 40ms, 50ms, 60ms]`).
   - Dark / Light / System theme switching.
   - Accent color picker.
   - Sound effects and tactile vibration toggle.
   - Full JSON Export & Import backup mechanism.
   - One-tap demo starter data loading & factory reset.

7. **PWA & Offline-First**:
   - Installable on iOS Safari, Android, and Desktop browsers.
   - In-app install button and guided iOS Safari instructions.
   - LocalStorage data layer wrapped in an async storage module ready for backend replacement.
   - Works 100% offline with service worker caching.

---

## 🚀 Setup & Run Instructions

### Prerequisites
- Node.js 18+ and npm installed.

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
# Build production bundle and service worker assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Code Structure

```
├── public/                 # PWA icons, manifest assets, and favicons
├── scripts/                # Asset generation scripts
├── src/
│   ├── components/
│   │   ├── common/         # ColorMap, PWAInstallButton, OfflineIndicator
│   │   ├── habits/         # HabitListScreen, HabitFormModal, DeleteConfirmModal
│   │   ├── layout/         # Header, BottomNav
│   │   ├── settings/       # SettingsScreen
│   │   ├── stats/          # StatsScreen, Heatmap90Days, WeeklyChart
│   │   └── today/          # TodayScreen, ProgressRing, DateSelector, HabitCard, CelebrationModal
│   ├── hooks/              # useHabits, usePWAInstall, useOnlineStatus
│   ├── storage/            # Abstracted storage layer (localStorage wrapper)
│   ├── types/              # TypeScript interfaces and data models
│   ├── utils/              # date.ts, streaks.ts, sound.ts, notifications.ts
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Tailwind CSS base styles & typography
│   └── main.tsx            # React application entry point
├── vite.config.ts          # Vite & VitePWA configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 💡 Architecture & Storage Notes

All habit records and completion maps are persisted locally in `localStorage` under `habitpulse_habits_v1` and `habitpulse_logs_v1`. 

The `src/storage/storage.ts` module exposes typed async methods (`getHabits()`, `saveHabits()`, `getLogs()`, `saveLogs()`) with event notifications so you can easily replace `localStorage` with a backend API, Firestore, or SQLite database without modifying UI components.
