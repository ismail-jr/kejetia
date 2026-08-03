<p align="center">
  <img src="public/images/logo.png" alt="Kejetia logo" width="96" height="96" />
</p>

<h1 align="center">Kejetia</h1>

<p align="center">
  A verified peer-to-peer service marketplace for University of Cape Coast students —
  request and offer services, book and get paid, and message each other, all gated behind
  a university-email-only identity.
</p>

## Overview

Kejetia is split into two independently-run services:

| Service      | What it is                                                             | Default port |
| ------------ | ----------------------------------------------------------------------| ------------- |
| **Frontend** | Next.js 16 (App Router) app — marketplace, dashboards, chat, admin    | `3000`        |
| **Backend**  | Express auth gateway — OTP registration, sign-in, login lockout       | `5000`        |

Almost everything else (marketplace listings, bookings, reviews, messaging, storage, row-level
security) talks directly to **Supabase** from the frontend using the Supabase JS client — the
Express backend exists solely to own the parts that need a service-role key or server-side
secrets (OTP email delivery, password sign-in, login-attempt rate limiting).

## Features

- **University-verified accounts** — registration is restricted to `@stu.ucc.edu.gh` /
  `@ucc.edu.gh` addresses, confirmed via a 6-digit emailed OTP.
- **Dual-role identity** — one account can hold both a Student and a Provider role and switch
  between them; a second role can be unlocked with just a password (no repeat OTP).
- **Marketplace** — browse, filter, and book services; provider listings go through an admin
  approval queue before going live.
- **Bookings & payments** — booking lifecycle (pending → accepted → completed), reviews gated to
  completed bookings, guarded status/payment transitions.
- **Realtime messaging** — 1:1 and booking-scoped chat with attachments, read receipts, unread
  counts, and Supabase Realtime updates.
- **Admin console** — listing/provider approvals, ID verification, reports.
- **Hardened by design** — Postgres Row-Level Security on every table, `SECURITY DEFINER` RPCs
  for anything that needs to cross RLS boundaries safely, column-level grants so anonymous
  visitors never see PII, and a Redis-backed login lockout that fails open (never blocks login)
  if the cache is unavailable — falling back to an in-process store automatically.

## Tech Stack

**Frontend** — Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · React Query · React Hook
Form + Zod · Supabase JS (`@supabase/ssr`)

**Backend** — Node.js · Express 5 · Supabase Admin SDK · Redis (OTP storage & rate limiting,
with an automatic in-memory fallback) · Nodemailer

**Data & Infra** — Supabase (Postgres, Auth, Storage, Realtime) · Redis (Upstash recommended) ·
Vercel (frontend hosting) · Render (backend hosting)

## Project Structure

```text
kejetia/
├── app/                      # Next.js App Router pages
│   ├── (dashboard)/          # Public provider profile pages
│   ├── admin/                # Admin console (approvals, listings, reports)
│   ├── student/              # Student dashboard, bookings, browse, messages
│   ├── provider/             # Provider dashboard, listings, orders, analytics
│   ├── marketplace/          # Public marketplace browse + service detail
│   ├── login/ register/ verify/ role-selection/
│   └── layout.tsx            # Root layout, fonts, metadata/favicon
├── components/
│   ├── ui/                   # shadcn/radix primitives
│   ├── auth/ booking/ chat/ landing/ marketplace/ profile/ dashboard/ layout/
├── contexts/                 # AuthProvider, QueryProvider
├── hooks/                    # React Query hooks, toast hook
├── lib/
│   ├── data/                 # Supabase data-access functions per domain
│   ├── api/auth.ts           # Client for the Express auth gateway
│   ├── messaging-data.ts     # Chat data layer (RPC-backed conversation list, attachments)
│   ├── supabase.ts           # Supabase browser client
│   └── database.types.ts     # Generated Supabase types
├── backend/                  # Express auth gateway (separate process — see below)
│   └── src/
│       ├── controllers/ routes/ middleware/ services/ config/
├── supabase/
│   ├── migrations/           # SQL migrations (schema, RLS, RPCs, security hardening)
│   └── scripts/              # One-off admin scripts
└── public/images/            # Logo and static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A Redis instance — [Upstash](https://console.upstash.com) recommended (free tier, no
  inactivity auto-deletion)
- An SMTP account for sending OTP emails (Gmail App Password works fine for development)

### 1. Clone and install

```bash
git clone <repository-url>
cd kejetia
npm install
cd backend && npm install && cd ..
```

### 2. Configure environment variables

**Frontend** — create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email
```

**Backend** — copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=5000
ALLOWED_ORIGINS=http://localhost:3000

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server only — never expose to the browser

REDIS_URL=rediss://default:password@your-db.upstash.io:6379

SMTP_SERVICE=gmail
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM=your-address@gmail.com
```

> If Redis is ever unreachable, the backend automatically falls back to an in-process memory
> store (`backend/src/config/memory-store.js`) so registration and login keep working on a
> single instance — but that fallback doesn't survive restarts or scale across multiple
> instances, so treat a Redis outage as something to fix promptly, not ignore.

### 3. Apply database migrations

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Alternatively, run the SQL files under `supabase/migrations/` in order through the Supabase SQL
Editor.

### 4. Run both servers

The frontend and backend are separate processes — start each in its own terminal:

```bash
# Terminal 1 — frontend (http://localhost:3000)
npm run dev

# Terminal 2 — backend auth gateway (http://localhost:5000)
cd backend
npm run dev
```

Sign-in, registration, and role-unlock all call the backend directly, so the app cannot
authenticate unless both are running.

## Available Scripts

**Frontend** (project root)

| Command               | Description                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Next.js dev server       |
| `npm run build`        | Production build                   |
| `npm run start`        | Start the production build         |
| `npm run lint`         | Run ESLint                         |
| `npm run type-check`   | Run `tsc --noEmit`                 |

**Backend** (`backend/`)

| Command         | Description                              |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start with nodemon (auto-restart)         |
| `npm run start` | Start with plain `node`                   |

## Authentication Flow

**Registration**

1. User submits email, name, student ID, role, and password.
2. Backend validates the email is a UCC address, creates an unconfirmed Supabase Auth user, and
   generates a 6-digit OTP, storing its hash + pending profile data in Redis with a 10-minute TTL.
3. OTP is emailed via Nodemailer.
4. User submits the code; on match, the backend confirms the email, provisions the chosen role
   (student/provider profile row), and returns a session.

**Sign-in**

1. User submits email + password.
2. A per-email lockout check runs first (fails open if Redis is down).
3. Supabase Auth validates credentials.
4. On failure, a lockout counter increments; after 5 failed attempts the account is locked for
   15 minutes.
5. On success, the user's roles/active role are loaded and a session is returned.

## Roles

- **Student** — browse and book services, message providers, track bookings, leave reviews.
- **Provider** — list services (pending admin approval), manage bookings/orders, message
  clients, view earnings/analytics.
- **Admin** — approve/reject listings and provider verification, review reports, moderate.

A single UCC email can hold both the Student and Provider role simultaneously and switch
between them from the dashboard.

## Security Notes

- Every table is covered by Postgres Row-Level Security; cross-boundary operations (creating a
  booking conversation, listing conversation previews, provisioning a role) go through
  `SECURITY DEFINER` RPCs rather than relaxing table-level policies.
- Anonymous/public queries only ever receive column-level grants for non-sensitive fields —
  contact details, mobile money numbers, and student IDs are never exposed on public profile or
  testimonial views.
- Backend error responses never leak internal error details (stack traces, DB constraint names)
  to the client; specifics are logged server-side only.
- Storage buckets (avatars, message attachments) use owner-scoped paths enforced by storage RLS
  policies, not just client-side convention.

## Deployment

- **Frontend** — deploy to [Vercel](https://vercel.com); set the frontend env vars above in the
  project settings.
- **Backend** — deploy to [Render](https://render.com) (or Railway/Fly.io/any Node host); set
  the backend env vars above, and update `ALLOWED_ORIGINS` to include your production frontend
  origin.
- **Database/Cache** — Supabase project + a Redis instance (Upstash recommended) reachable from
  wherever the backend is hosted.

## License

MIT
