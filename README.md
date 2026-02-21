# THRIVE — Job Search Tracker

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
make install
```

### 2. Start Supabase

```bash
make db-start
```

This starts local Postgres, Auth, Storage, and Studio services via Docker. On first run, it automatically applies all migrations.

### 3. Set up environment

```bash
cp frontend/.env.example frontend/.env.local
```

For local development, use the keys output by `supabase start`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

### 4. Seed the database (optional)

```bash
make db-seed
```

Populates the database with sample companies, applications, interviews, documents, and contacts.

### 5. Start the dev server

```bash
make dev
```

Open [http://localhost:3000](http://localhost:3000) and create an account to get started.

## Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start Supabase + dev server |
| `make test` | Run tests |
| `make test-watch` | Run tests in watch mode |
| `make lint` | Check linting (read-only, no auto-fix) |
| `make type` | TypeScript type check |
| `make build` | Production build |
| `make db-start` | Start Supabase services |
| `make db-stop` | Stop Supabase services |
| `make db-reset` | Reset database and apply migrations |
| `make db-seed` | Reset + seed with sample data |
| `make db-types` | Regenerate TypeScript types from schema |

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
