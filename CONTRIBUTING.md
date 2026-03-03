# Contributing to `jobsearch-tracker`

Contributions are welcome and appreciated! Every bit helps.

## Ways to Contribute

- **Report bugs** — open an issue at https://github.com/joeblackwaslike/jobsearch-tracker/issues
- **Fix bugs** — look for issues tagged `bug` + `help wanted`
- **Implement features** — look for issues tagged `enhancement` + `help wanted`
- **Improve documentation** — typos, clarity, missing steps

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Supabase CLI](https://supabase.com/docs/guides/cli) v2+
- [Docker](https://www.docker.com/) (for local Supabase)

### Setup

1. Fork the repo and clone your fork:

```bash
git clone git@github.com:YOUR_NAME/jobsearch-tracker.git
cd jobsearch-tracker
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment files:

```bash
cp frontend/.env.example frontend/.env.local
cp supabase/.env.example supabase/.env
```

4. Start the dev environment (starts Supabase, then the dev server):

```bash
pnpm dev
```

### Running Tests

```bash
pnpm test          # run tests once
pnpm test:watch    # run tests in watch mode
pnpm type          # TypeScript type check
pnpm lint:check    # lint check (read-only)
pnpm lint          # lint + auto-fix
```

## Development Workflow

This project follows **Test-Driven Development**:

1. Write a failing test that describes the desired behavior
2. Write the minimum code to make it pass
3. Refactor while keeping tests green
4. Commit (one commit per red-green-refactor cycle)

Never write feature code without a failing test first.

## Submitting a Pull Request

1. Create a branch: `git checkout -b fix/my-bug` or `feat/my-feature`
2. Make your changes following the TDD cycle above
3. Ensure all tests pass: `pnpm test`
4. Ensure no lint errors: `pnpm lint:check`
5. Push and open a pull request against `main`

PRs should include tests for any new functionality. Keep the scope narrow — one concern per PR.

## Commit Style

```
feat: add archive button to application table
fix: prevent double-submit on application form
test: add tests for archive dialog
docs: update getting started instructions
```

Prefixes: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`
