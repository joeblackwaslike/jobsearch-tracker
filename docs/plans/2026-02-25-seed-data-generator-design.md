# Seed Data Generator Design

**Date:** 2026-02-25
**Area:** Seed data
**Status:** Approved

## Problem

`supabase/seed.ts` contains raw entity arrays (54 applications, 13 companies, 18 events, 12 contacts, ~18 documents) with no relational assignments. The database requires:

- Every application to have a `company_id`
- Every event to have an `application_id` with chronologically valid dates (screening first, onsite last)
- Contacts to have `company_id` (already set in seed.ts)
- Junction rows in `application_documents` (90% of apps get a resume, 20% get a cover letter)
- Junction rows in `event_contacts` (1–3 contacts per event, from the correct company)

The previous `seed.old.sql` was hand-authored for a small dataset (~6 apps). The new seed has 54 apps and needs to be regeneratable as data evolves.

## Approach

A single TypeScript generator script (`supabase/generate-seed.ts`) imports `seed.ts`, assembles all relations programmatically, and prints a valid `DO $$ ... END $$` SQL block to stdout.

```
npx tsx supabase/generate-seed.ts > supabase/seed.sql
```

A `"seed:generate"` script is added to `package.json`. The committed `seed.sql` is the stable artifact used by `supabase db reset`.

Rejected alternatives:
- **Hand-crafted SQL**: 54 apps × all columns = unmaintainable; any seed data change requires manual SQL edits
- **Module-based generator**: premature complexity for a one-shot script

## Data Flow

The generator runs five stages in sequence:

### 1. Assign UUIDs

All entities missing an `id` receive one via `crypto.randomUUID()`. Entities in `seed.ts` that already have a hardcoded `id` (companies, some documents) keep theirs to preserve `parent_id` references.

### 2. Application → Company mapping

Round-robin assignment:

```
app[i].company_id = companies[i % companies.length].id
```

54 apps across 13 companies → ~4 apps per company, evenly distributed.

### 3. Event → Application mapping

The 18 events are grouped into **6 interview tracks** and assigned to active applications (status: `interviewing`, `offer`, `accepted`, or `rejected`). `scheduled_at` dates are **authored fresh** in the generator — original dates from `seed.ts` are ignored. The ordering rule is always enforced: screening first, onsite last, all other types in between.

| Track | App status | Event sequence | Notes |
|---|---|---|---|
| 1 | `interviewing` | screening → behavioral → technical | recent past, in progress |
| 2 | `interviewing` | screening → technical → behavioral → onsite | last event upcoming |
| 3 | `offer` | screening → technical → behavioral → onsite | all completed ~6 weeks ago |
| 4 | `accepted` | screening → behavioral → technical → onsite | all completed ~8 weeks ago |
| 5 | `rejected` | screening → technical | ended ~4 weeks ago |
| 6 | `interviewing` | screening → behavioral → technical | upcoming technical |

One spare event (18 − 17 used) is dropped. Only events with an assigned application are emitted.

### 4. Document → Application mapping

Non-archived documents of each type are collected. Assignments:

- **Resumes**: `Math.floor(54 * 0.9) = 48` apps → pick a resume document (cycle through available resumes by index)
- **Cover letters**: `Math.floor(54 * 0.2) = 10` apps → every 5th app in the list gets a cover letter

Each assignment produces one `application_documents` row.

### 5. Event → Contact mapping

For each event, the generator:
1. Looks up the event's application → gets `company_id`
2. Finds all contacts with that `company_id`
3. Assigns 1–3 of them (cycling through the contact list) via `event_contacts` rows

## SQL Output Format

A single `DO $$ DECLARE ... BEGIN ... END $$` block:

1. Header comment (prerequisites: `supabase start`, sign up a user, `supabase db reset`)
2. Resolve `v_user_id` from `auth.users ORDER BY created_at ASC LIMIT 1` — raises exception if none found
3. `INSERT INTO companies (...) VALUES ...`
4. `INSERT INTO applications (...) VALUES ...`
5. `INSERT INTO documents (...) VALUES ...`
6. `INSERT INTO contacts (...) VALUES ...`
7. `INSERT INTO events (...) VALUES ...`
8. `INSERT INTO application_documents (...) VALUES ...`
9. `INSERT INTO event_contacts (...) VALUES ...`

All UUIDs are inlined as string literals. Multi-row `VALUES` syntax throughout.

## Edge Cases

| Case | Handling |
|---|---|
| Company has no contacts | Events for that app emit no `event_contacts` rows (avoids FK violation) |
| `events.notes` is non-nullable | Defaults to `''` when not set in `seed.ts` |
| Documents without `id` in seed.ts | Generator assigns fresh UUID; `parent_id` links resolved before SQL emit |
| 54 apps not divisible by 13 | Round-robin wraps cleanly; last few companies get one fewer app |
| Cover letter 20% rounding | `Math.floor(54 * 0.2) = 10`; every 5th app assigned one |

## Files Changed

| File | Change |
|---|---|
| `supabase/generate-seed.ts` | New — generator script |
| `supabase/seed.sql` | Replaced — generated output |
| `supabase/seed.ts` | Unchanged — source of truth for raw data |
| `package.json` | Add `"seed:generate": "tsx supabase/generate-seed.ts > supabase/seed.sql"` |
