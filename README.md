# `jobsearch-tracker`

A full-featured job search tracking application to manage applications, companies, interviews, documents, and contacts from a single dashboard.

## Features

- **Dashboard** — Overview with stats cards, activity feed, and quick actions
- **Applications** — Track job applications with status, filters, sorting, and archival
- **Companies** — Company directory with research notes, ratings, and tech stack info
- **Interviews** — Schedule and track upcoming and past interviews
- **Documents** — Manage resumes, cover letters, and other files with upload support
- **Contacts** — Track people associated with companies and link them to interview events
- **Settings** — Theme (dark/light), language, date format, notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (Vite 7 + TanStack Router) |
| UI | React 19, [shadcn/ui](https://ui.shadcn.com), Tailwind CSS v4 |
| Backend | [Supabase](https://supabase.com) (Postgres, Auth, Storage) |
| State | TanStack Query (server), URL params (UI) |
| Forms | React Hook Form + Zod |
| Linting | [Biome](https://biomejs.dev) (lint, format, imports) |
| Testing | Vitest + Testing Library (91 tests) |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) v2+
- [Docker](https://www.docker.com/) (for local Supabase)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/joeblackwaslike/jobsearch-tracker.git
cd jobsearch-tracker
pnpm install
```

### 2. Set up environment

```bash
cp frontend/.env.example frontend/.env.local
cp supabase/.env.example supabase/.env.local
```

Edit `frontend/.env.local` and `supabase/.env.local` with your api keys, etc.
For local development, use the keys output by `supabase start`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

### 3. Start Supabase

```bash
pnpm db:start
```

This starts local Postgres, Auth, Storage, and Studio services via Docker. On first run, it automatically applies all migrations.

### 4. Seed the database (optional)

**Option A — quick start** (auto-creates a dev account):

```bash
pnpm db:seed
```

Resets the database and populates it with sample data. Then log in at [http://localhost:3000](http://localhost:3000) with:

```
Email:    dev@example.com
Password: devpassword123
```

**Option B — seed under your own account**:

```bash
pnpm db:reset        # fresh database, no seed data
```

Sign up at [http://localhost:3000](http://localhost:3000) with your own email, then:

```bash
pnpm db:reseed       # seeds sample data under your account
```

### 5. Start the dev server

```bash
pnpm dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Supabase + dev server |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint:check` | Check linting (read-only) |
| `pnpm lint` | Lint + auto-fix |
| `pnpm type` | TypeScript type check |
| `pnpm build` | Production build |
| `pnpm db:start` | Start Supabase services |
| `pnpm db:stop` | Stop Supabase services |
| `pnpm db:reset` | Reset database (migrations only, no seed data) |
| `pnpm db:seed` | Reset + seed under auto-created `dev@example.com` |
| `pnpm db:reseed` | Seed sample data under the first existing user |
| `pnpm db:types` | Regenerate TypeScript types from schema |

## Database Schema

Eight tables with Row Level Security (RLS) — all data is scoped to the authenticated user:

- **companies** — Company profiles with industry, size, ratings, tech stack
- **applications** — Job applications linked to companies with status tracking
- **events** — Interviews and timeline events linked to applications
- **documents** — Resumes, cover letters, and files (with Supabase Storage)
- **application_documents** — Snapshot linking documents to specific applications
- **contacts** — People associated with companies
- **event_contacts** — Links contacts to interview events (interviewers)
- **user_settings** — Per-user preferences (auto-created on signup)

## Deployment

The frontend is configured for Vercel deployment. Set the following environment variables in your Vercel project:

- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anon/public key

## License

MIT
