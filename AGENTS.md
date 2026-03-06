# CLAUDE.md

## Project Overview

THRIVE is a job search tracking application built with TanStack Start, Supabase, and shadcn/ui. It helps users manage job applications, companies, interviews, documents, and contacts from a single dashboard.

## Tech Stack

- **Framework:** TanStack Start (Vite 7 + TanStack Router + server functions)
- **UI:** React 19, shadcn/ui (new-york style), Radix primitives, Tailwind CSS v4
- **Backend:** Supabase (Postgres with RLS, Auth, Storage)
- **State:** TanStack Query for server state, URL search params for UI state
- **Forms:** React Hook Form + Zod v4 (using `zod/v3` compat layer for `@hookform/resolvers`)
- **Linting:** Biome (lint, format, import sorting)
- **Testing:** Vitest + Testing Library + jsdom (91 tests across 22 files)
- **Package Manager:** pnpm

## Project Structure

```text
├── frontend/                  # TanStack Start app
│   ├── src/
│   │   ├── components/
│   │   │   ├── applications/  # Application CRUD, table, filters, detail, events
│   │   │   ├── auth/          # Login and signup forms
│   │   │   ├── companies/     # Company directory, cards, form, contacts
│   │   │   ├── dashboard/     # Stats, charts, quick actions, activity
│   │   │   ├── documents/     # Sidebar, editor, upload dialog
│   │   │   ├── interviews/    # Interview list, schedule dialog
│   │   │   ├── layout/        # NavBar, ThemeProvider, PageShell
│   │   │   ├── settings/      # General settings tab
│   │   │   └── ui/            # shadcn/ui primitives (do not edit directly)
│   │   ├── lib/
│   │   │   ├── queries/       # TanStack Query hooks per domain
│   │   │   ├── supabase/      # Client, server, generated types
│   │   │   └── utils.ts       # cn() helper
│   │   ├── routes/            # File-based routing (TanStack Router)
│   │   │   ├── __root.tsx     # Root layout (providers, devtools)
│   │   │   ├── _authenticated.tsx  # Auth guard layout
│   │   │   ├── _authenticated/     # Protected pages
│   │   │   ├── login.tsx      # Public login page
│   │   │   └── index.tsx      # Redirect to /dashboard
│   │   ├── test/              # Test setup and utilities
│   │   └── styles/            # Global CSS with Tailwind
│   ├── vite.config.ts         # Vite + TanStack Start + Tailwind
│   └── vitest.config.ts       # Separate test config
├── supabase/
│   ├── config.toml            # Local Supabase config
│   ├── migrations/            # SQL migrations (RLS, triggers, indexes)
│   └── seed.sql               # Development seed data
├── docs/plans/                # Design docs and implementation plans
└── Makefile                   # Dev commands
```

## Development Commands

Run from the repo root (pnpm workspace delegates to the `frontend` package):

```bash
pnpm dev          # Start Supabase + frontend dev server (port 3000)
pnpm db:start     # Start Supabase services only
pnpm db:stop      # Stop Supabase services
pnpm db:reset     # Reset database and run migrations
pnpm db:seed      # Reset + apply seed data
pnpm db:types     # Regenerate TypeScript types from schema
pnpm test         # Run tests once
pnpm test:watch   # Run tests in watch mode
pnpm lint         # Check linting (no auto-fix)
pnpm type         # TypeScript type check
pnpm build        # Production build
pnpm install      # Install frontend dependencies
```

## Development Rules

### TDD is Required

All development in this repo MUST follow Test-Driven Development (red-green-refactor):

1. **Red:** Write a failing test first that describes the desired behavior
2. **Green:** Write the minimum code to make the test pass
3. **Refactor:** Clean up while keeping tests green
4. **Commit:** Commit after each green cycle

Never write feature code without a failing test first. Use `superpowers:test-driven-development` for guidance.

## VERY IMPORTANT: Google gemini models only
Google gemini models have problems hanging indefinately when they try to run `pnpm vitest`.  For this reason gemini based agents must run vitest like so:
```sh
npx vitest run <test_file_name>
```
DO NOT RUN `pnpm test` or `pnpm test:watch`.

#### Test File Locations

Tests can live either colocated with components in `__tests__/` directories or as `.test.tsx` files alongside the source. Both patterns are acceptable:

```text
frontend/src/components/applications/__tests__/archive-dialog.test.tsx
frontend/src/components/applications/archive-dialog.test.tsx
```

Test utilities and setup are in `frontend/src/test/`.

### Conventions

- **Routing:** TanStack Router file-based routes in `src/routes/`. Auth-protected routes go under `_authenticated/`.
- **Server functions:** Use `createServerFn` from `@tanstack/react-start` for server-side logic. Import cookies from `@tanstack/react-start/server` (NOT `vinxi/http`).
- **Supabase clients:** Browser client from `src/lib/supabase/client.ts`, server client from `src/lib/supabase/server.ts`. Always use `@supabase/ssr` cookie-based auth.
- **Query hooks:** One file per domain in `src/lib/queries/`. Each exports query keys, query hooks, and mutation hooks.
- **UI components:** shadcn/ui primitives in `src/components/ui/` — regenerate with `npx shadcn@latest add <component>`, don't hand-edit.
- **Styling:** Tailwind CSS v4 with `@tailwindcss/vite` plugin. Dark mode via `dark` class on `<html>`. Use `cn()` from `src/lib/utils.ts` for conditional classes.
- **Forms:** React Hook Form with Zod validation. Import Zod schemas from `zod/v3` when passing to `zodResolver`.
- **URL state:** Use TanStack Router `validateSearch` with Zod schemas for filter/tab/pagination state in URLs.
- **Database:** All tables have RLS policies scoped to `auth.uid()`. Trigger functions that run cross-schema need `SECURITY DEFINER` with `SET search_path = public`.

### Commit Style

- Prefix: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`
- Commit after each TDD cycle (red-green-refactor = one commit)
- Keep commits small and focused

## Architecture Reference

Detailed design docs live in `docs/architecture/`. Read the relevant file before working in any of these areas:

- `constitution.md` — stable product principles and constraints; overrides any one-off spec
- `project.md` — high-level system overview, goals, and component map
- `data_model.md` — database schema, entity relationships, and RLS patterns
- `api_layer.md` — server function conventions, extension API endpoints, and OpenAPI spec
- `edge-functions.md` — Supabase edge function patterns and deployment notes
- `ui.md` — UI architecture, component conventions, and routing patterns

Also see `docs/plans/` for implementation plans (past and current).

**Important:** Always create new design documents and implementation plans in `docs/plans/` or `docs/prds/`. Do not create a `docs/design/` directory or place design docs anywhere else under `docs/`.

## Superpowers Skills

Use the uperpowers skills during development. When in doubt, invoke the skill — it's better to check and not need it than to skip it.
