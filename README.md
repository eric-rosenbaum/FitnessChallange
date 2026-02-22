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
