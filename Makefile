.PHONY: dev db-start db-stop db-reset db-seed db-types test test-watch lint type install build

# Start everything for local development
dev: db-start
	cd frontend && pnpm dev

# Database
db-start:
	supabase start

db-stop:
	supabase stop

db-reset:
	supabase db reset

db-seed:
	supabase db reset
	psql "$$(supabase status -o json | jq -r .DB_URL)" -f supabase/seed.sql

# Generate TypeScript types from database schema
db-types:
	supabase gen types typescript --local > frontend/src/lib/supabase/types.ts

# Tests
test:
	cd frontend && pnpm test

test-watch:
	cd frontend && pnpm test:watch

# Lint and typecheck
lint:
	cd frontend && pnpm lint:check

type:
	cd frontend && pnpm type

# Frontend
install:
	cd frontend && pnpm install

# Build
build:
	cd frontend && pnpm build
