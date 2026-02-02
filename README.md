# Fitness Challenge Tracker - Frontend MVP

A mobile-first web application for friend groups to run weekly fitness challenges with cardio and strength goals.

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

1. Install dependencies:
```bash
npm install
```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

The app will be available at `http://localhost:3000` and will automatically reload when you make changes.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home dashboard
│   ├── log/               # Log workout page
│   ├── create-challenge/  # Create challenge page (host only)
│   └── settings/          # Group settings (admin only)
├── components/            # React components
│   ├── StickyTopBar.tsx
│   ├── ChallengeSummaryCard.tsx
│   ├── ProgressCard.tsx
│   ├── Leaderboard.tsx
│   ├── ActivityFeed.tsx
│   └── EmptyState.tsx
├── context/               # React context for state management
│   └── AppContext.tsx
├── lib/                   # Utility functions and dummy data
│   └── dummyData.ts
└── types/                 # TypeScript type definitions
    └── index.ts
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
