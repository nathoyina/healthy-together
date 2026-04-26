# Healthy Together

**Social habit tracking for people who want accountability without the noise.** This repo is a full-stack web app: check in on health-style habits, compare progress with friends, and optionally compete in small groups.

## Description / Overview

Healthy Together helps you **track recurring habits** (daily yes/no, weekly counts, or daily totals), see **streaks and weekly progress**, and stay honest with **friends** and **groups**. It is for anyone building routines—workouts, mobility, runs, or custom habits—who wants lightweight logging and optional social pressure.

You sign in with a **username and password** (implemented via Supabase email under the hood). Onboarding can clone **starter template habits**; the dashboard is your daily **check-in** surface. Each habit has a **friend leaderboard** ranked by total check-ins on that habit.

### Why Habits First (Not Raw Totals)

This app prioritizes **habit goals** (done today, count today, count this week) over cumulative totals (e.g. “50,000 total steps”) because habit loops drive repeat behavior. Habit-based tracking is also fairer across different starting fitness levels and does not require everyone to connect wearable integrations before they can participate. In short: it optimizes for consistency and team participation, not only volume.


## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/healthy-together.git
   cd healthy-together
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a Supabase project** at [supabase.com](https://supabase.com) and note the **Project URL** and **anon public** key (Settings → API).

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. See `.env.example` for optional variables (site URL, synthetic email host) and auth notes.

5. **Apply database migrations** (schema, RLS, seed templates, grants, fixes)

   - **Supabase CLI** (recommended): link the project and push migrations from `supabase/migrations/`.
   - **Or** run each SQL file in order in the Supabase SQL Editor (especially `0001_init.sql`, then `0002`–`0006` as needed for an existing database).

   For local development, disabling **Confirm email** under Authentication → Providers → Email avoids magic-link rate limits when testing sign-up.

6. **Run the app** (see Usage).

## Usage

**Development server** (hot reload):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, complete onboarding, then use **Check-in** for today’s habits and **Habits** to open a habit’s detail page (friend leaderboard, groups, recent log).

**Production build**:

```bash
npm run build
npm start
```

**Lint**:

```bash
npm run lint
```

Typical flow: **Register** → **Onboarding** (username + starter habits) → **Check-in** dashboard → open a habit → **Friend leaderboard** (you + accepted friends on that habit) → **Friends** / **Groups** for social features.

## Features

- **Habit types**: daily binary (done / not done), weekly count (e.g. sessions per ISO week), daily count.
- **Check-in dashboard** with streaks, weekly bars, and realtime-friendly updates.
- **Starter template habits** (seeded in Supabase) cloneable at onboarding or from Habits.
- **Friends**: search by username, requests, accept/decline, shared visibility for goals.
- **Groups**: create/join with invite codes, share a goal to a group, group leaderboard.
- **Per-habit friend leaderboard** ranked by total check-ins (sum of entries) among you and accepted friends.
- **Profiles & public handles** (`/u/[username]`) for discovery.
- **PWA-oriented assets** (manifest, icons) for installable mobile use.
- **Row-level security** on Supabase tables; migrations include fixes for API grants and `group_members` RLS recursion.

## Tech Stack / Built With

| Area | Stack |
|------|--------|
| **Framework** | [Next.js](https://nextjs.org) 16 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com)-style components |
| **Backend / data** | [Supabase](https://supabase.com) (Postgres, Auth, Realtime) |
| **Auth in app** | `@supabase/ssr` (cookies + middleware), username/password → synthetic email mapping for GoTrue |
| **Validation / dates** | Zod, date-fns |
| **Icons** | Lucide React |
| **Toasts** | Sonner |

Database schema and policies live under `supabase/migrations/` (single source of truth for tables, RLS, triggers, and seed data).
