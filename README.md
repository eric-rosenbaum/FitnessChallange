# Fitness Challenge

A mobile-first web app (and future iOS app) for friend groups to run weekly fitness challenges with cardio and strength goals.

## Repo structure

- **`web/`** — Next.js web app. Run from here: `cd web && npm run dev`
- **`ios/`** — Swift/iOS app (to be added). Same Supabase backend.
- **`supabase/`** — Migrations and backend config shared by web and iOS.

## Features

- **Home Dashboard**: View current week's challenge, your progress, leaderboard, and activity feed
- **Log Workouts**: Log cardio activities (run/walk/bike) and strength exercises
- **Create Challenges**: Weekly hosts can create challenges with cardio and strength goals
- **Group Settings**: Admins can manage group settings and assign weekly hosts
- **Responsive Design**: Mobile-first UI that works beautifully on desktop

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Dummy Data** (no backend/auth in this MVP)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Go into the web app and install dependencies:
```bash
cd web && npm install
```

### Running the web app

From the repo root:
```bash
cd web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### iOS app (Supabase backend)

The iOS app uses the **same Supabase project** as the web app. To run with real data:

1. **Supabase URL and key**  
   In your [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**:
   - Copy **Project URL**
   - Copy **anon public** key

2. **Add config to the iOS app**  
   In Xcode, open the `FitnessChallenge` target and add your credentials using **one** of these options:

   - **Option A – Plist (recommended)**  
     - Copy `ios/FitnessChallenge/FitnessChallenge/Supabase-Config.example.plist` to `Supabase-Config.plist` in the same folder.
     - Open `Supabase-Config.plist` and replace:
       - `SUPABASE_URL` → your Project URL (e.g. `https://xxxx.supabase.co`)
       - `SUPABASE_ANON_KEY` → your anon key
     - In Xcode, add `Supabase-Config.plist` to the app target (File → Add Files to "FitnessChallenge" → select the file, ensure "Copy items if needed" and the target are checked).

   - **Option B – Info.plist**  
     Add the same two keys (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) to the target’s **Info** tab (or a custom plist) with your values.

3. **Xcode**  
   - Open `ios/FitnessChallenge/FitnessChallenge.xcodeproj` in Xcode.
   - The Supabase Swift package is already linked (SPM). If you see package resolution errors, use **File → Packages → Reset Package Caches** and then **Resolve Package Versions**.
   - Select a simulator or device and run (**⌘R**).

4. **Behavior**  
   - **With config:** The app uses Supabase Auth (email/password) and your real database (groups, members, challenges, logs, etc.). Sign up or sign in, set your display name, then create a group or join with an invite code.
   - **Without config:** The app runs with dummy data and a one-tap “Sign In (Dummy)” for quick testing.

No extra Xcode capabilities (e.g. Keychain) are required beyond the default. Use the same Supabase project as the web app so data is shared.

### Build for production

```bash
cd web && npm run build && npm start
```

## Project structure

```
├── web/                   # Next.js app (see web/README or run: cd web && npm run dev)
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── lib/
│   └── types/
├── ios/                   # Swift iOS app (to be added)
└── supabase/              # Migrations, shared backend
```

## Current User

The app is configured with dummy data. The current user is:
- **User ID**: `user-1` (display name: "You")
- **Role**: Admin
- **Group**: "Fitness Friends"

## UI States

The app handles these states:
- No active week assignment
- Active assignment but no challenge created yet
- Active challenge with full dashboard

## Next Steps

This is the frontend MVP with dummy data. The next phase will:
1. Set up Supabase project
2. Create database schema and migrations
3. Connect frontend to Supabase
4. Add authentication with Supabase Auth
5. Implement Row Level Security policies

## Notes

- All data is stored in local React state (no persistence)
- Logs, challenges, and settings changes are simulated
- The app uses dummy data that resets on page refresh
- Progress calculations match the spec exactly
