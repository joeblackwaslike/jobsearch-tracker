# Contributing

Contributions are welcome! This is a personal project but issues, suggestions, and PRs are appreciated.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) v2+
- [Docker](https://www.docker.com/) (for local Supabase)

## Setup

```bash
git clone https://github.com/joeblackwaslike/jobsearch-tracker.git
cd jobsearch-tracker
pnpm install
cp frontend/.env.example frontend/.env.local
cp supabase/.env.example supabase/.env
pnpm dev
```

## Development

This project follows **Test-Driven Development** (red-green-refactor). Write a failing test before writing feature code.

```bash
pnpm test          # run tests once
pnpm test:watch    # watch mode
pnpm type          # TypeScript type check
pnpm lint:check    # lint check
pnpm lint          # lint + auto-fix
```

## Pull Requests

1. Create a branch: `feat/my-feature` or `fix/my-bug`
2. Follow the TDD cycle: failing test, minimal fix, refactor
3. Ensure `pnpm test && pnpm lint:check && pnpm type` pass
4. Open a PR against `main`

Commit prefixes: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`
