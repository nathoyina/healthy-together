# Healthy Together

**Company-wide habit tracking for teams that want shared accountability.** This repo is a full-stack web app where employees join company goals, check in daily, and compare progress on shared leaderboards.

## Description / Overview

Healthy Together helps teams **track recurring habits** (daily yes/no, weekly counts, or daily totals), see **streaks and weekly progress**, and stay accountable through **company-wide goals**. It is designed for workplaces that want lightweight wellness routines without heavy integrations.

You sign in with a **username, company code, and password** (implemented via Supabase email under the hood). Onboarding lets users join company goals; the dashboard is the daily **check-in** surface. Each habit has a **company leaderboard** ranked by total check-ins from all participants on that goal.

## Demo

View public URL here: https://healthy-together-too.vercel.app

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

5. **Apply database migrations** (schema, tenancy, RLS, default company goals, fixes)

   - **Supabase CLI** (recommended): link the project and push migrations from `supabase/migrations/`.
  - **Or** run each SQL file in order in the Supabase SQL Editor (including newer migrations such as `0010`–`0012` for company-code tenancy).

   For local development, disabling **Confirm email** under Authentication → Providers → Email avoids magic-link rate limits when testing sign-up.

6. **Run the app** (see Usage).

## Usage

**Development server** (hot reload):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with a valid company code, complete onboarding, then use **Check-in** for today’s habits and **Habits** to open a habit’s detail page (company leaderboard, recent log).

**Production build**:

```bash
npm run build
npm start
```

**Lint**:

```bash
npm run lint
```

Typical flow: **Create company code (admin SQL once)** → **Register** (username + company code) → **Onboarding** (join company goals) → **Check-in** dashboard → open a habit → **Company leaderboard** (all participants on that goal).

## Features

- **Habit types**: daily binary (done / not done), weekly count (e.g. sessions per ISO week), daily count.
- **Check-in dashboard** with streaks, weekly bars, and realtime-friendly updates.
- **Company-code tenancy**: users are isolated by company and join with a company code.
- **Public/private goals**: create private habits or public company goals colleagues can join.
- **Default company goals**: easy seed goals for new companies (via admin SQL flow).
- **Per-habit company leaderboard** ranked by total check-ins (sum of entries) among participants.
- **Profiles & public handles** (`/u/[username]`) for discovery.
- **PWA-oriented assets** (manifest, icons) for installable mobile use.
- **Row-level security** on Supabase tables with company isolation, plus policy fixes from iterative migrations.

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
